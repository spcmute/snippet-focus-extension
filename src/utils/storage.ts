import { ExtensionSettings, Snippet, StorageData } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  focusReader: {
    fontSize: 18,
    lineHeight: 1.8,
    maxWidth: 720,
    theme: 'light',
    fontFamily: 'Georgia, serif',
    showProgressBar: true,
    highlightCurrentLine: false,
  },
  api: {
    selectedProvider: 'github',
  },
  autoSave: true,
  notifications: true,
  defaultLanguage: 'javascript',
  snippetSortOrder: 'date',
};

export async function loadStorage(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['snippets', 'settings'], (result) => {
      resolve({
        snippets: (result.snippets as Snippet[]) ?? [],
        settings: { ...DEFAULT_SETTINGS, ...(result.settings as Partial<ExtensionSettings>) },
      });
    });
  });
}

export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ snippets }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ settings }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

export async function getSnippetById(id: string): Promise<Snippet | undefined> {
  const { snippets } = await loadStorage();
  return snippets.find((s) => s.id === id);
}

export async function exportSnippets(): Promise<string> {
  const { snippets } = await loadStorage();
  return JSON.stringify(snippets, null, 2);
}

export async function importSnippets(json: string): Promise<number> {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Formato inválido');
  const { snippets } = await loadStorage();
  const merged = [...snippets];
  let imported = 0;
  for (const item of parsed) {
    if (isValidSnippet(item) && !merged.find((s) => s.id === item.id)) {
      merged.push(item);
      imported++;
    }
  }
  await saveSnippets(merged);
  return imported;
}

function isValidSnippet(obj: unknown): obj is Snippet {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'content' in obj &&
    'language' in obj
  );
}
