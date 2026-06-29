import React, { useEffect, useState } from 'react';
import { AiSuggestion, ApiConfig, GitHubGist, Snippet } from '../types';
import { createGitHubGist, fetchGitHubGists, getAiSuggestion } from '../utils/api';
import { loadStorage } from '../utils/storage';

interface Props {
  config: ApiConfig;
}

export default function ApiPanel({ config }: Props): React.JSX.Element {
  const [gists, setGists] = useState<GitHubGist[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedSnippetId, setSelectedSnippetId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState<'github' | 'ai'>('github');

  useEffect(() => {
    loadStorage().then(({ snippets: s }) => setSnippets(s));
  }, []);

  async function loadGists(): Promise<void> {
    if (!config.githubToken) { setStatus('Token do GitHub não configurado.'); return; }
    setLoading(true);
    setStatus('');
    try {
      const g = await fetchGitHubGists(config.githubToken);
      setGists(g);
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function exportToGist(): Promise<void> {
    const snippet = snippets.find((s) => s.id === selectedSnippetId);
    if (!snippet) { setStatus('Selecione um snippet.'); return; }
    if (!config.githubToken) { setStatus('Token do GitHub não configurado.'); return; }
    setLoading(true);
    setStatus('');
    try {
      const gist = await createGitHubGist(config.githubToken, snippet);
      setStatus(`✓ Exportado! ${gist.html_url}`);
      await loadGists();
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeWithAi(): Promise<void> {
    const snippet = snippets.find((s) => s.id === selectedSnippetId);
    if (!snippet) { setStatus('Selecione um snippet.'); return; }
    setLoading(true);
    setStatus('');
    setAiResult(null);
    try {
      const result = await getAiSuggestion(config, snippet);
      setAiResult(result);
    } catch (e) {
      setStatus(`Erro: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="api-panel">
      <div className="api-tabs">
        <button className={`api-tab ${activeTab === 'github' ? 'active' : ''}`} onClick={() => setActiveTab('github')}>
          GitHub Gists
        </button>
        <button className={`api-tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          Análise IA
        </button>
      </div>

      <div className="api-snippet-select">
        <label>Snippet</label>
        <select value={selectedSnippetId} onChange={(e) => setSelectedSnippetId(e.target.value)}>
          <option value="">— selecione um snippet —</option>
          {snippets.map((s) => (
            <option key={s.id} value={s.id}>[{s.language}] {s.title}</option>
          ))}
        </select>
      </div>

      {activeTab === 'github' && (
        <div className="api-section">
          <div className="api-actions">
            <button className="btn btn-primary btn-sm" onClick={exportToGist} disabled={loading || !selectedSnippetId}>
              {loading ? '⟳ Exportando…' : '↑ Exportar para Gist'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={loadGists} disabled={loading}>
              {loading ? '⟳' : '↻ Meus Gists'}
            </button>
          </div>

          {gists.length > 0 && (
            <div className="api-gist-list">
              <div className="api-gist-header">Seus Gists ({gists.length})</div>
              {gists.slice(0, 10).map((g) => (
                <a key={g.id} href={g.html_url} target="_blank" rel="noopener noreferrer" className="api-gist-item">
                  <span className="api-gist-desc">{g.description || 'Sem descrição'}</span>
                  <span className="api-gist-date">{new Date(g.updated_at).toLocaleDateString('pt-BR')}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="api-section">
          <p className="api-hint">
            Analisa seu snippet com IA e sugere descrição, tags e melhorias.
            Configure a chave da API nas opções.
          </p>
          <button className="btn btn-primary btn-sm" onClick={analyzeWithAi} disabled={loading || !selectedSnippetId}>
            {loading ? '⟳ Analisando…' : '✦ Analisar com IA'}
          </button>

          {aiResult && (
            <div className="api-ai-result">
              <div className="api-ai-section">
                <strong>Descrição:</strong>
                <p>{aiResult.description}</p>
              </div>
              {aiResult.tags.length > 0 && (
                <div className="api-ai-section">
                  <strong>Tags sugeridas:</strong>
                  <div className="sm-tags">{aiResult.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                </div>
              )}
              {aiResult.improvedCode && (
                <div className="api-ai-section">
                  <strong>Código melhorado:</strong>
                  <pre className="api-ai-code">{aiResult.improvedCode}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {status && (
        <div className={`api-status ${status.startsWith('✓') ? 'success' : 'error'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
