import { ExtensionMessage, RunSnippetResult, Snippet } from '../types';
import { loadStorage, saveSnippets } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-snippet',
    title: 'Salvar como Snippet',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'focus-mode',
    title: 'Ativar Modo Foco nesta página',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'save-snippet' && info.selectionText) {
    const { snippets, settings } = await loadStorage();
    const newSnippet: Snippet = {
      id: uuidv4(),
      title: `Snippet de ${new URL(tab.url ?? 'about:blank').hostname}`,
      content: info.selectionText,
      language: settings.defaultLanguage,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      url: tab.url,
      favorite: false,
    };
    await saveSnippets([...snippets, newSnippet]);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SnippetFocus',
      message: 'Snippet salvo com sucesso!',
    });
  }

  if (info.menuItemId === 'focus-mode') {
    const msg: ExtensionMessage = { type: 'TOGGLE_FOCUS_MODE' };
    chrome.tabs.sendMessage(tab.id, msg);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;
  if (command === 'toggle-focus-mode') {
    const msg: ExtensionMessage = { type: 'TOGGLE_FOCUS_MODE' };
    chrome.tabs.sendMessage(tab.id, msg);
  }
  if (command === 'save-snippet') {
    const msg: ExtensionMessage = { type: 'GET_SELECTION' };
    chrome.tabs.sendMessage(tab.id, msg, async (response: { text?: string } | undefined) => {
      if (!response?.text) return;
      const { snippets, settings } = await loadStorage();
      const newSnippet: Snippet = {
        id: uuidv4(),
        title: `Snippet — ${new Date().toLocaleDateString('pt-BR')}`,
        content: response.text,
        language: settings.defaultLanguage,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        url: tab.url,
        favorite: false,
      };
      await saveSnippets([...snippets, newSnippet]);
    });
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'SNIPPET_SAVED') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SnippetFocus',
      message: 'Snippet salvo!',
    });
    sendResponse({ ok: true });
  }

  if (message.type === 'RUN_SNIPPET') {
    const code = message.payload as string;

    chrome.tabs.query({ active: true }, (tabs) => {
      const tab = tabs.find(
        (t) =>
          t.url &&
          !t.url.startsWith('chrome-extension://') &&
          !t.url.startsWith('chrome://') &&
          !t.url.startsWith('about:') &&
          !t.url.startsWith('edge://')
      );

      if (!tab?.id) {
        sendResponse({ ok: false, error: 'Nenhuma página web activa encontrada.\nAbra uma página web e tente novamente.' } as RunSnippetResult);
        return;
      }

      const target = { tabId: tab.id };

      // chrome.debugger bypasses page CSP entirely — the only reliable way
      // to eval user-provided code in a page from an extension.
      chrome.debugger.attach(target, '1.3', () => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: 'Não foi possível conectar o debugger:\n' + (chrome.runtime.lastError.message ?? '') } as RunSnippetResult);
          return;
        }

        chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
          expression: code,
          returnByValue: true,
          awaitPromise: true,
        }, (res) => {
          chrome.debugger.detach(target);

          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message ?? 'Erro desconhecido' } as RunSnippetResult);
            return;
          }

          const r = res as { result?: { value?: unknown; type?: string }; exceptionDetails?: { text?: string; exception?: { description?: string } } };

          if (r?.exceptionDetails) {
            const errMsg = r.exceptionDetails.exception?.description ?? r.exceptionDetails.text ?? 'Erro na execução';
            sendResponse({ ok: false, error: errMsg, tabTitle: tab.title ?? tab.url } as RunSnippetResult);
          } else {
            const val = r?.result?.value;
            const display = val === undefined
              ? '(undefined)'
              : typeof val === 'object'
              ? JSON.stringify(val, null, 2)
              : String(val);
            sendResponse({ ok: true, value: display, tabTitle: tab.title ?? tab.url } as RunSnippetResult);
          }
        });
      });
    });
  }

  return true; // keep channel open for async sendResponse
});
