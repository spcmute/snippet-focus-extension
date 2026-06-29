export type SnippetLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'css'
  | 'html'
  | 'sql'
  | 'bash'
  | 'json'
  | 'markdown'
  | 'text';

export interface Snippet {
  id: string;
  title: string;
  content: string;
  language: SnippetLanguage;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  url?: string;
  favorite: boolean;
  description?: string;
}

export interface FocusReaderSettings {
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  theme: 'light' | 'dark' | 'sepia';
  fontFamily: string;
  showProgressBar: boolean;
  highlightCurrentLine: boolean;
}

export interface ApiConfig {
  githubToken?: string;
  openAiKey?: string;
  selectedProvider: 'github' | 'openai' | 'custom';
  customEndpoint?: string;
  customApiKey?: string;
}

export interface ExtensionSettings {
  focusReader: FocusReaderSettings;
  api: ApiConfig;
  autoSave: boolean;
  notifications: boolean;
  defaultLanguage: SnippetLanguage;
  snippetSortOrder: 'date' | 'title' | 'language';
}

export interface StorageData {
  snippets: Snippet[];
  settings: ExtensionSettings;
  lastSync?: number;
}

export type MessageType =
  | 'TOGGLE_FOCUS_MODE'
  | 'SAVE_SNIPPET'
  | 'GET_SELECTION'
  | 'FOCUS_MODE_ENABLED'
  | 'FOCUS_MODE_DISABLED'
  | 'SNIPPET_SAVED'
  | 'RUN_SNIPPET'
  | 'EVAL_CODE';

export interface RunSnippetResult {
  ok: boolean;
  value?: unknown;
  error?: string;
  tabTitle?: string;
}

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface GitHubGist {
  id: string;
  description: string;
  public: boolean;
  files: Record<string, { filename: string; content: string; language: string }>;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  description: string;
  improvedCode?: string;
  tags: string[];
}
