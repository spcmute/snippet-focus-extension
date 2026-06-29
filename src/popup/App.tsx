import React, { useEffect, useState } from 'react';
import SnippetManager from '../components/SnippetManager';
import ApiPanel from '../components/ApiPanel';
import { ExtensionMessage, ExtensionSettings } from '../types';
import { loadStorage } from '../utils/storage';

type Tab = 'snippets' | 'api' | 'focus';

export default function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('snippets');
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [focusActive, setFocusActive] = useState(false);

  useEffect(() => {
    loadStorage().then(({ settings: s }) => setSettings(s));
  }, []);

  async function toggleFocusMode(): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    const msg: ExtensionMessage = { type: 'TOGGLE_FOCUS_MODE' };
    chrome.tabs.sendMessage(tab.id, msg);
    setFocusActive((v) => !v);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="#4f86f7" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="#4f86f7" opacity=".6" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="#4f86f7" opacity=".6" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="#4f86f7" opacity=".3" />
          </svg>
          <span>SnippetFocus</span>
        </div>
        <nav className="app-nav">
          <button className={`nav-btn ${tab === 'snippets' ? 'active' : ''}`} onClick={() => setTab('snippets')}>Snippets</button>
          <button className={`nav-btn ${tab === 'api' ? 'active' : ''}`} onClick={() => setTab('api')}>API</button>
          <button className={`nav-btn ${tab === 'focus' ? 'active' : ''}`} onClick={() => setTab('focus')}>Foco</button>
        </nav>
      </header>

      <main className="app-body">
        {tab === 'snippets' && <SnippetManager />}
        {tab === 'api' && settings && <ApiPanel config={settings.api} />}
        {tab === 'focus' && (
          <div className="focus-tab">
            <div className="focus-hero">
              <div className="focus-icon">{focusActive ? '📖' : '🔍'}</div>
              <h2>Modo Foco</h2>
              <p>Ativa uma visualização limpa e sem distrações para leitura da página atual.</p>
              <button className={`btn btn-primary ${focusActive ? 'focus-active' : ''}`} onClick={toggleFocusMode}>
                {focusActive ? '✕ Desativar Modo Foco' : '◎ Ativar Modo Foco'}
              </button>
            </div>

            <div className="focus-shortcuts">
              <h3>Atalhos</h3>
              <div className="shortcut-row"><kbd>Alt+F</kbd><span>Ativar/desativar modo foco</span></div>
              <div className="shortcut-row"><kbd>Alt+S</kbd><span>Salvar seleção como snippet</span></div>
              <div className="shortcut-row"><kbd>Esc</kbd><span>Fechar modo foco</span></div>
              <div className="shortcut-row"><kbd>A+ / A−</kbd><span>Ajustar tamanho da fonte</span></div>
              <div className="shortcut-row"><kbd>◑</kbd><span>Alternar tema (claro/escuro/sépia)</span></div>
            </div>

            <div className="focus-tip">
              <strong>Dica:</strong> Clique com o botão direito em qualquer seleção de texto e escolha
              "Salvar como Snippet" para capturar rapidamente.
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <a href="#" onClick={() => chrome.runtime.openOptionsPage()}>⚙ Configurações</a>
        <span className="footer-sep">·</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
}
