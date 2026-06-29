import React, { useEffect, useState } from 'react';
import { ExtensionSettings, SnippetLanguage } from '../types';
import { DEFAULT_SETTINGS, exportSnippets, importSnippets, loadStorage, saveSettings } from '../utils/storage';

const FONTS = ['Georgia, serif', 'system-ui, sans-serif', '"JetBrains Mono", monospace', '"Merriweather", serif'];
const LANGUAGES: SnippetLanguage[] = ['javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'sql', 'bash', 'json', 'markdown', 'text'];

export default function Options(): React.JSX.Element {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [activeSection, setActiveSection] = useState<'reader' | 'api' | 'general' | 'data'>('general');

  useEffect(() => {
    loadStorage().then(({ settings: s }) => setSettings(s));
  }, []);

  function update<K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]): void {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function updateFocus<K extends keyof ExtensionSettings['focusReader']>(key: K, value: ExtensionSettings['focusReader'][K]): void {
    setSettings((s) => ({ ...s, focusReader: { ...s.focusReader, [key]: value } }));
    setSaved(false);
  }

  function updateApi<K extends keyof ExtensionSettings['api']>(key: K, value: ExtensionSettings['api'][K]): void {
    setSettings((s) => ({ ...s, api: { ...s.api, [key]: value } }));
    setSaved(false);
  }

  async function save(): Promise<void> {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport(): Promise<void> {
    const json = await exportSnippets();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(): Promise<void> {
    try {
      const count = await importSnippets(importText);
      setImportMsg(`✓ ${count} snippet(s) importado(s) com sucesso!`);
      setImportText('');
    } catch {
      setImportMsg('✕ Formato inválido. Use um JSON exportado por esta extensão.');
    }
  }

  const navItems: Array<{ id: typeof activeSection; label: string }> = [
    { id: 'general', label: 'Geral' },
    { id: 'reader', label: 'Modo Foco' },
    { id: 'api', label: 'Integrações API' },
    { id: 'data', label: 'Dados' },
  ];

  return (
    <div className="opts-layout">
      <aside className="opts-sidebar">
        <div className="opts-brand">
          <strong>SnippetFocus</strong>
          <span>Configurações</span>
        </div>
        <nav className="opts-nav">
          {navItems.map((item) => (
            <button key={item.id} className={`opts-nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => setActiveSection(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="opts-main">
        {activeSection === 'general' && (
          <section className="opts-section">
            <h2>Configurações Gerais</h2>
            <div className="opts-field">
              <label>Linguagem padrão para novos snippets</label>
              <select value={settings.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value as SnippetLanguage)}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="opts-field">
              <label>Ordenar snippets por</label>
              <select value={settings.snippetSortOrder} onChange={(e) => update('snippetSortOrder', e.target.value as ExtensionSettings['snippetSortOrder'])}>
                <option value="date">Data de atualização</option>
                <option value="title">Título (A-Z)</option>
                <option value="language">Linguagem</option>
              </select>
            </div>
            <div className="opts-toggle">
              <div>
                <strong>Notificações</strong>
                <p>Mostrar notificações ao salvar snippets via menu de contexto.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={settings.notifications} onChange={(e) => update('notifications', e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
            <div className="opts-toggle">
              <div>
                <strong>Auto-salvar</strong>
                <p>Salvar automaticamente ao capturar texto selecionado.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={settings.autoSave} onChange={(e) => update('autoSave', e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
          </section>
        )}

        {activeSection === 'reader' && (
          <section className="opts-section">
            <h2>Modo Foco — Leitor</h2>
            <div className="opts-field">
              <label>Tema padrão</label>
              <select value={settings.focusReader.theme} onChange={(e) => updateFocus('theme', e.target.value as 'light' | 'dark' | 'sepia')}>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="sepia">Sépia</option>
              </select>
            </div>
            <div className="opts-field">
              <label>Família de fonte</label>
              <select value={settings.focusReader.fontFamily} onChange={(e) => updateFocus('fontFamily', e.target.value)}>
                {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
              </select>
            </div>
            <div className="opts-field">
              <label>Tamanho da fonte: {settings.focusReader.fontSize}px</label>
              <input type="range" min={12} max={32} value={settings.focusReader.fontSize} onChange={(e) => updateFocus('fontSize', Number(e.target.value))} />
            </div>
            <div className="opts-field">
              <label>Altura de linha: {settings.focusReader.lineHeight}</label>
              <input type="range" min={1.2} max={2.4} step={0.1} value={settings.focusReader.lineHeight} onChange={(e) => updateFocus('lineHeight', Number(e.target.value))} />
            </div>
            <div className="opts-field">
              <label>Largura máxima: {settings.focusReader.maxWidth}px</label>
              <input type="range" min={480} max={1200} step={40} value={settings.focusReader.maxWidth} onChange={(e) => updateFocus('maxWidth', Number(e.target.value))} />
            </div>
            <div className="opts-toggle">
              <div><strong>Barra de progresso</strong><p>Mostrar progresso de leitura no topo.</p></div>
              <label className="toggle">
                <input type="checkbox" checked={settings.focusReader.showProgressBar} onChange={(e) => updateFocus('showProgressBar', e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
          </section>
        )}

        {activeSection === 'api' && (
          <section className="opts-section">
            <h2>Integrações API</h2>
            <div className="opts-field">
              <label>Provedor padrão</label>
              <select value={settings.api.selectedProvider} onChange={(e) => updateApi('selectedProvider', e.target.value as ExtensionSettings['api']['selectedProvider'])}>
                <option value="github">GitHub Gists</option>
                <option value="openai">OpenAI</option>
                <option value="custom">API Personalizada</option>
              </select>
            </div>
            <div className="opts-field">
              <label>Token do GitHub (para Gists)</label>
              <input type="password" value={settings.api.githubToken ?? ''} onChange={(e) => updateApi('githubToken', e.target.value)} placeholder="ghp_xxxxxxxxxxxx" />
              <span className="opts-hint">Gere em: github.com → Settings → Developer settings → Personal access tokens</span>
            </div>
            <div className="opts-field">
              <label>Chave da API OpenAI</label>
              <input type="password" value={settings.api.openAiKey ?? ''} onChange={(e) => updateApi('openAiKey', e.target.value)} placeholder="sk-xxxxxxxxxxxx" />
            </div>
            <div className="opts-field">
              <label>Endpoint personalizado (URL)</label>
              <input type="url" value={settings.api.customEndpoint ?? ''} onChange={(e) => updateApi('customEndpoint', e.target.value)} placeholder="https://sua-api.com/analyze" />
            </div>
            <div className="opts-field">
              <label>Chave da API personalizada</label>
              <input type="password" value={settings.api.customApiKey ?? ''} onChange={(e) => updateApi('customApiKey', e.target.value)} placeholder="Bearer token ou chave" />
            </div>
            <p className="opts-hint opts-security">
              🔒 Todas as chaves são armazenadas localmente via chrome.storage.local e nunca saem do seu navegador, exceto para as próprias APIs configuradas.
            </p>
          </section>
        )}

        {activeSection === 'data' && (
          <section className="opts-section">
            <h2>Importar e Exportar Dados</h2>
            <div className="opts-card">
              <h3>Exportar snippets</h3>
              <p>Baixe todos os seus snippets em formato JSON.</p>
              <button className="btn btn-primary" onClick={handleExport}>⬇ Exportar JSON</button>
            </div>
            <div className="opts-card">
              <h3>Importar snippets</h3>
              <p>Cole o conteúdo de um arquivo JSON exportado anteriormente.</p>
              <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"id": "...", "title": "...", ...}]' spellCheck={false} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
              <button className="btn btn-primary" onClick={handleImport} disabled={!importText.trim()}>⬆ Importar</button>
              {importMsg && <p className={`opts-import-msg ${importMsg.startsWith('✓') ? 'success' : 'error'}`}>{importMsg}</p>}
            </div>
          </section>
        )}

        <div className="opts-footer">
          <button className="btn btn-primary" onClick={save}>{saved ? '✓ Salvo!' : 'Salvar configurações'}</button>
        </div>
      </main>
    </div>
  );
}
