import { ExtensionMessage } from '../types';

let focusModeActive = false;
let overlay: HTMLElement | null = null;
let progressBar: HTMLElement | null = null;

// Allow demo snippet injection via postMessage from the page
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SF_INJECT_SNIPPET' && event.data.snippet) {
    chrome.storage.local.get(['snippets'], (result) => {
      const snippets = Array.isArray(result.snippets) ? result.snippets : [];
      chrome.storage.local.set({ snippets: [...snippets, event.data.snippet] }, () => {
        window.postMessage({ type: 'SF_SNIPPET_SAVED', ok: true }, '*');
      });
    });
  }
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'TOGGLE_FOCUS_MODE') {
      focusModeActive ? disableFocusMode() : enableFocusMode();
    }
    if (message.type === 'GET_SELECTION') {
      sendResponse({ text: window.getSelection()?.toString() ?? '' });
    }
    return true;
  }
);

function enableFocusMode(): void {
  focusModeActive = true;

  // Inject styles
  injectStyles();

  // Build overlay
  overlay = document.createElement('div');
  overlay.id = 'snippetfocus-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Modo Foco');

  const toolbar = buildToolbar();
  const reader = buildReaderContent();

  progressBar = document.createElement('div');
  progressBar.id = 'snippetfocus-progress';

  overlay.appendChild(progressBar);
  overlay.appendChild(toolbar);
  overlay.appendChild(reader);
  document.body.appendChild(overlay);
  document.body.classList.add('snippetfocus-active');

  // Progress on scroll
  overlay.addEventListener('scroll', updateProgress);
  updateProgress();

  // Close on Escape
  document.addEventListener('keydown', handleKeyDown);
}

function disableFocusMode(): void {
  focusModeActive = false;
  overlay?.remove();
  overlay = null;
  progressBar = null;
  document.body.classList.remove('snippetfocus-active');
  document.removeEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') disableFocusMode();
}

function buildToolbar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = 'snippetfocus-toolbar';

  const title = document.createElement('span');
  title.textContent = document.title;
  title.className = 'sf-title';

  const controls = document.createElement('div');
  controls.className = 'sf-controls';

  const fontDown = makeButton('A−', () => adjustFont(-2));
  const fontUp = makeButton('A+', () => adjustFont(2));
  const themeBtn = makeButton('◑', toggleTheme);
  const closeBtn = makeButton('✕', disableFocusMode);
  closeBtn.setAttribute('title', 'Fechar (Esc)');

  controls.append(fontDown, fontUp, themeBtn, closeBtn);
  bar.append(title, controls);
  return bar;
}

function buildReaderContent(): HTMLElement {
  const content = document.createElement('div');
  content.id = 'snippetfocus-content';

  const article = findMainContent();
  content.innerHTML = article?.innerHTML ?? document.body.innerHTML;

  // Remove scripts/iframes inside reader
  content.querySelectorAll('script,iframe,noscript,style').forEach((el) => el.remove());

  return content;
}

function findMainContent(): Element | null {
  const selectors = ['article', 'main', '[role="main"]', '.post-content', '.article-body', '#content'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'sf-btn';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function adjustFont(delta: number): void {
  if (!overlay) return;
  const content = overlay.querySelector<HTMLElement>('#snippetfocus-content');
  if (!content) return;
  const current = parseFloat(getComputedStyle(content).fontSize) || 18;
  content.style.fontSize = `${Math.min(32, Math.max(12, current + delta))}px`;
}

let currentTheme: 'light' | 'dark' | 'sepia' = 'light';
function toggleTheme(): void {
  if (!overlay) return;
  const themes: Array<typeof currentTheme> = ['light', 'dark', 'sepia'];
  currentTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
  overlay.setAttribute('data-theme', currentTheme);
}

function updateProgress(): void {
  if (!overlay || !progressBar) return;
  const { scrollTop, scrollHeight, clientHeight } = overlay;
  const pct = scrollHeight <= clientHeight ? 100 : (scrollTop / (scrollHeight - clientHeight)) * 100;
  progressBar.style.width = `${pct}%`;
}

function injectStyles(): void {
  if (document.getElementById('snippetfocus-styles')) return;
  const style = document.createElement('style');
  style.id = 'snippetfocus-styles';
  style.textContent = `
    body.snippetfocus-active { overflow: hidden !important; }

    #snippetfocus-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      overflow-y: auto; background: var(--sf-bg, #fff); color: var(--sf-text, #111);
      font-family: Georgia, 'Times New Roman', serif;
      transition: background 0.3s, color 0.3s;
    }
    #snippetfocus-overlay[data-theme="dark"] { --sf-bg: #1a1a2e; --sf-text: #e0e0e0; --sf-link: #7ecfff; --sf-toolbar: #0f0f1e; }
    #snippetfocus-overlay[data-theme="sepia"] { --sf-bg: #f4ecd8; --sf-text: #3b2b1a; --sf-link: #7a4a1e; --sf-toolbar: #e8d8b4; }
    #snippetfocus-overlay[data-theme="light"] { --sf-bg: #fff; --sf-text: #111; --sf-link: #0055cc; --sf-toolbar: #f5f5f5; }

    #snippetfocus-progress {
      position: sticky; top: 0; height: 3px; background: #4f86f7;
      z-index: 10; transition: width 0.1s;
    }

    #snippetfocus-toolbar {
      position: sticky; top: 3px; z-index: 9;
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 24px; background: var(--sf-toolbar, #f5f5f5);
      border-bottom: 1px solid rgba(0,0,0,.1);
      font-family: system-ui, sans-serif;
    }
    .sf-title { font-size: 14px; font-weight: 600; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sf-controls { display: flex; gap: 8px; }
    .sf-btn {
      border: 1px solid rgba(0,0,0,.2); background: transparent; cursor: pointer;
      border-radius: 4px; padding: 4px 10px; font-size: 14px;
      color: var(--sf-text, #111); transition: background 0.2s;
    }
    .sf-btn:hover { background: rgba(0,0,0,.08); }

    #snippetfocus-content {
      max-width: 720px; margin: 40px auto 80px; padding: 0 24px;
      font-size: 18px; line-height: 1.8; color: var(--sf-text, #111);
    }
    #snippetfocus-content img { max-width: 100%; height: auto; border-radius: 4px; }
    #snippetfocus-content a { color: var(--sf-link, #0055cc); }
    #snippetfocus-content pre, #snippetfocus-content code {
      background: rgba(0,0,0,.06); border-radius: 4px; font-family: monospace;
      padding: 2px 6px; font-size: 0.9em;
    }
    #snippetfocus-content pre { padding: 16px; overflow-x: auto; }
  `;
  document.head.appendChild(style);
}
