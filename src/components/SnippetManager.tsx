import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RunSnippetResult, Snippet, SnippetLanguage } from '../types';
import { loadStorage, saveSnippets } from '../utils/storage';

const LANGUAGES: SnippetLanguage[] = [
  'javascript', 'typescript', 'python', 'rust', 'go',
  'css', 'html', 'sql', 'bash', 'json', 'markdown', 'text',
];

export default function SnippetManager(): React.JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'edit' | 'new'>('list');
  const [selected, setSelected] = useState<Snippet | null>(null);
  const [filterLang, setFilterLang] = useState<SnippetLanguage | 'all'>('all');
  const [onlyFav, setOnlyFav] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunSnippetResult>>({});
  const [form, setForm] = useState<Partial<Snippet>>({});
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadStorage().then(({ snippets: s }) => setSnippets(s));
  }, []);

  const persist = useCallback(async (updated: Snippet[]) => {
    setSnippets(updated);
    await saveSnippets(updated);
  }, []);

  const filtered = snippets.filter((s) => {
    const q = query.toLowerCase();
    const matchQ = !q || s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
    const matchL = filterLang === 'all' || s.language === filterLang;
    const matchF = !onlyFav || s.favorite;
    return matchQ && matchL && matchF;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  function openNew(): void {
    setForm({ language: 'javascript', tags: [], content: '', title: '' });
    setTagInput('');
    setView('new');
  }

  function openEdit(s: Snippet): void {
    setSelected(s);
    setForm({ ...s });
    setTagInput('');
    setView('edit');
  }

  async function saveForm(): Promise<void> {
    if (!form.title?.trim() || !form.content?.trim()) return;
    if (view === 'new') {
      const s: Snippet = {
        id: uuidv4(),
        title: form.title.trim(),
        content: form.content.trim(),
        language: form.language ?? 'text',
        tags: form.tags ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        favorite: false,
        description: form.description,
      };
      await persist([...snippets, s]);
    } else if (selected) {
      const updated = snippets.map((s) =>
        s.id === selected.id ? { ...s, ...form, updatedAt: Date.now() } as Snippet : s
      );
      await persist(updated);
    }
    setView('list');
  }

  async function deleteSnippet(id: string): Promise<void> {
    await persist(snippets.filter((s) => s.id !== id));
    if (view !== 'list') setView('list');
  }

  async function toggleFavorite(id: string): Promise<void> {
    await persist(snippets.map((s) => s.id === id ? { ...s, favorite: !s.favorite } : s));
  }

  async function runSnippet(s: Snippet): Promise<void> {
    setRunning(s.id);
    setRunResults((prev) => {
      const next = { ...prev };
      delete next[s.id];
      return next;
    });
    try {
      const result = await new Promise<RunSnippetResult>((resolve) => {
        chrome.runtime.sendMessage({ type: 'RUN_SNIPPET', payload: s.content }, resolve);
      });
      setRunResults((prev) => ({ ...prev, [s.id]: result }));
    } catch (e) {
      setRunResults((prev) => ({ ...prev, [s.id]: { ok: false, error: (e as Error).message } }));
    } finally {
      setRunning(null);
    }
  }

  async function copySnippet(s: Snippet): Promise<void> {
    await navigator.clipboard.writeText(s.content);
    setCopied(s.id);
    setTimeout(() => setCopied(null), 1500);
  }

  function addTag(): void {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags?.includes(t)) return;
    setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }));
    setTagInput('');
  }

  function removeTag(t: string): void {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((x) => x !== t) }));
  }

  if (view === 'new' || view === 'edit') {
    return (
      <div className="sm-form">
        <div className="sm-form-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>← Voltar</button>
          <h2>{view === 'new' ? 'Novo Snippet' : 'Editar Snippet'}</h2>
        </div>
        <div className="sm-field">
          <label>Título *</label>
          <input value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Nome do snippet" />
        </div>
        <div className="sm-field">
          <label>Descrição</label>
          <input value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição opcional" />
        </div>
        <div className="sm-row">
          <div className="sm-field" style={{ flex: 1 }}>
            <label>Linguagem</label>
            <select value={form.language ?? 'text'} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as SnippetLanguage }))}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="sm-field">
          <label>Tags</label>
          <div className="sm-tag-input">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Adicionar tag (Enter)" />
            <button className="btn btn-ghost btn-sm" onClick={addTag}>+</button>
          </div>
          {(form.tags ?? []).length > 0 && (
            <div className="sm-tags">
              {(form.tags ?? []).map((t) => (
                <span key={t} className="tag sm-tag-removable" onClick={() => removeTag(t)}>{t} ✕</span>
              ))}
            </div>
          )}
        </div>
        <div className="sm-field sm-code-field">
          <label>Código *</label>
          <textarea ref={textareaRef} rows={10} value={form.content ?? ''} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Cole ou escreva seu código aqui..." spellCheck={false} />
        </div>
        <div className="sm-form-actions">
          {view === 'edit' && selected && (
            <button className="btn btn-danger btn-sm" onClick={() => deleteSnippet(selected.id)}>Excluir</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={saveForm}>Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sm-list">
      <div className="sm-list-header">
        <div className="sm-search">
          <span className="sm-search-icon">⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar snippets..." />
          {query && <button className="btn-icon" onClick={() => setQuery('')}>✕</button>}
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Novo</button>
      </div>

      <div className="sm-filters">
        <select value={filterLang} onChange={(e) => setFilterLang(e.target.value as SnippetLanguage | 'all')}>
          <option value="all">Todas as linguagens</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <button className={`btn btn-sm ${onlyFav ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOnlyFav((v) => !v)}>
          ★ Favoritos
        </button>
      </div>

      <div className="sm-count">{filtered.length} snippet{filtered.length !== 1 ? 's' : ''}</div>

      <div className="sm-items">
        {filtered.length === 0 && (
          <div className="sm-empty">
            <div className="sm-empty-icon">📋</div>
            <p>{query ? 'Nenhum resultado encontrado' : 'Nenhum snippet ainda'}</p>
            {!query && <button className="btn btn-primary btn-sm" onClick={openNew}>Criar primeiro snippet</button>}
          </div>
        )}
        {filtered.map((s) => (
          <div key={s.id} className="sm-item">
            <div className="sm-item-top">
              <span className="badge badge-lang">{s.language}</span>
              <button className={`btn-icon ${s.favorite ? 'sm-fav-active' : ''}`} onClick={() => toggleFavorite(s.id)} title="Favorito">★</button>
            </div>
            <div className="sm-item-title" onClick={() => openEdit(s)}>{s.title}</div>
            {s.description && <div className="sm-item-desc">{s.description}</div>}
            <pre className="sm-item-preview">{s.content.slice(0, 120)}{s.content.length > 120 ? '…' : ''}</pre>
            {s.tags.length > 0 && (
              <div className="sm-item-tags">{s.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            )}
            <div className="sm-item-actions">
              <span className="sm-item-date">{new Date(s.updatedAt).toLocaleDateString('pt-BR')}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => copySnippet(s)}>
                {copied === s.id ? '✓ Copiado' : '⎘ Copiar'}
              </button>
              <button
                className={`btn btn-sm ${running === s.id ? 'btn-ghost' : 'btn-run'}`}
                onClick={() => runSnippet(s)}
                disabled={running === s.id}
                title="Executar no console da aba activa"
              >
                {running === s.id ? '⟳' : '▶ Executar'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✎ Editar</button>
            </div>
            {runResults[s.id] && (
              <div className={`sm-run-result ${runResults[s.id].ok ? 'ok' : 'err'}`}>
                <div className="sm-run-result-header">
                  <span>{runResults[s.id].ok ? '✓ Resultado' : '✕ Erro'}</span>
                  {runResults[s.id].tabTitle && (
                    <span className="sm-run-tab">em: {runResults[s.id].tabTitle}</span>
                  )}
                  <button className="btn-icon sm-run-close" onClick={() =>
                    setRunResults((p) => { const n = { ...p }; delete n[s.id]; return n; })
                  }>✕</button>
                </div>
                <pre className="sm-run-output">
                  {runResults[s.id].ok ? runResults[s.id].value as string : runResults[s.id].error}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
