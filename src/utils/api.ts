import { AiSuggestion, ApiConfig, GitHubGist, Snippet } from '../types';

export async function fetchGitHubGists(token: string): Promise<GitHubGist[]> {
  const res = await fetch('https://api.github.com/gists', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json() as Promise<GitHubGist[]>;
}

export async function createGitHubGist(
  token: string,
  snippet: Snippet
): Promise<GitHubGist> {
  const ext = languageExtension(snippet.language);
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: snippet.description ?? snippet.title,
      public: false,
      files: {
        [`${sanitizeFilename(snippet.title)}${ext}`]: {
          content: snippet.content,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json() as Promise<GitHubGist>;
}

export async function getAiSuggestion(
  config: ApiConfig,
  snippet: Snippet
): Promise<AiSuggestion> {
  if (config.selectedProvider === 'openai' && config.openAiKey) {
    return fetchOpenAiSuggestion(config.openAiKey, snippet);
  }
  if (config.selectedProvider === 'custom' && config.customEndpoint && config.customApiKey) {
    return fetchCustomApiSuggestion(config.customEndpoint, config.customApiKey, snippet);
  }
  throw new Error('Nenhum provedor de IA configurado');
}

async function fetchOpenAiSuggestion(apiKey: string, snippet: Snippet): Promise<AiSuggestion> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a code assistant. Analyze snippets and return JSON with: description (string), tags (string[]), and optionally improvedCode (string).',
        },
        {
          role: 'user',
          content: `Language: ${snippet.language}\n\nCode:\n${snippet.content}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return JSON.parse(data.choices[0].message.content) as AiSuggestion;
}

async function fetchCustomApiSuggestion(
  endpoint: string,
  apiKey: string,
  snippet: Snippet
): Promise<AiSuggestion> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language: snippet.language, code: snippet.content }),
  });
  if (!res.ok) throw new Error(`Custom API error: ${res.status}`);
  return res.json() as Promise<AiSuggestion>;
}

function languageExtension(lang: string): string {
  const map: Record<string, string> = {
    javascript: '.js', typescript: '.ts', python: '.py', rust: '.rs',
    go: '.go', css: '.css', html: '.html', sql: '.sql',
    bash: '.sh', json: '.json', markdown: '.md', text: '.txt',
  };
  return map[lang] ?? '.txt';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);
}
