# SnippetFocus — Chrome Extension

Extensão Chrome para **gerenciamento de snippets**, **leitor em modo foco** e **integração com APIs externas**.

## Funcionalidades

### Gerenciamento de Snippets
- Criar, editar, excluir e buscar snippets de código
- Suporte a 12 linguagens: JavaScript, TypeScript, Python, Rust, Go, CSS, HTML, SQL, Bash, JSON, Markdown, Text
- Tags personalizadas por snippet
- Marcar favoritos
- Ordenação por data, título ou linguagem
- Exportar/importar coleção em JSON
- Salvar texto selecionado via menu de contexto (clique direito)
- Atalho de teclado: `Alt+S`

### Leitor em Modo Foco
- Ativa uma visualização limpa e sem distrações sobre qualquer página
- Detecta automaticamente o conteúdo principal (`article`, `main`, etc.)
- Ajuste de fonte, altura de linha e largura máxima
- Três temas: Claro, Escuro e Sépia
- Barra de progresso de leitura
- Atalho: `Alt+F` | Fechar com `Esc`

### Integrações API
- **GitHub Gists**: exportar snippets diretamente como Gist privado e listar seus Gists
- **OpenAI**: análise de código com sugestão de descrição, tags e melhorias
- **API personalizada**: endpoint configurável para qualquer serviço compatível

## Estrutura do Projeto

```
snippet-focus-extension/
├── src/
│   ├── popup/          # Interface principal (React)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── popup.html
│   │   └── popup.css
│   ├── options/        # Página de configurações
│   │   ├── Options.tsx
│   │   ├── index.tsx
│   │   ├── options.html
│   │   └── options.css
│   ├── background/     # Service Worker (MV3)
│   │   └── background.ts
│   ├── content/        # Content Script (modo foco)
│   │   └── content.ts
│   ├── components/
│   │   ├── SnippetManager.tsx
│   │   └── ApiPanel.tsx
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── utils/
│   │   ├── storage.ts  # chrome.storage.local
│   │   └── api.ts      # GitHub / OpenAI / Custom API
│   └── styles/
│       └── global.css
├── public/
│   └── icons/          # 16, 32, 48, 128px PNGs
├── manifest.json       # Manifest V3
├── webpack.config.js
├── tsconfig.json
└── package.json
```

## Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm 9+

### Instalar dependências
```bash
npm install --legacy-peer-deps
```

### Build de desenvolvimento (com watch)
```bash
npm run dev
```

### Build de produção
```bash
npm run build
```

### Carregar no Chrome
1. Abra `chrome://extensions/`
2. Ative "Modo do desenvolvedor" (canto superior direito)
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `dist/`

## Publicação na Chrome Web Store

### 1. Gerar ícones reais
Substitua os placeholders em `public/icons/` por PNGs reais de 16, 32, 48 e 128px.
Use o SVG em `public/icons/icon.svg` como base.

### 2. Build de produção
```bash
npm run build
```

### 3. Empacotar extensão
Compacte a pasta `dist/` em um arquivo `.zip`:
```bash
# Windows PowerShell
Compress-Archive -Path dist\* -DestinationPath snippetfocus-v1.0.0.zip
```

### 4. Chrome Web Store Developer Dashboard
1. Acesse [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pague a taxa única de US$ 5 (se ainda não pagou)
3. Clique em "Novo item" e faça upload do `.zip`
4. Preencha:
   - **Nome**: SnippetFocus
   - **Descrição**: Use o texto abaixo
   - **Screenshots**: mínimo 1280×800 ou 640×400
   - **Ícone da Store**: 128×128px
   - **Categoria**: Ferramentas de desenvolvedor
   - **Idioma principal**: Português (Brasil)

### Descrição para a Store
```
SnippetFocus é uma extensão para desenvolvedores que reúne três ferramentas essenciais:

📋 GERENCIADOR DE SNIPPETS
• Salve, organize e busque trechos de código em 12 linguagens
• Adicione tags, descrições e marque favoritos
• Capture seleções de texto com clique direito ou Alt+S
• Exporte/importe sua coleção em JSON

📖 LEITOR EM MODO FOCO
• Ative uma visualização limpa e sem distrações com Alt+F
• Detecção automática do conteúdo principal da página
• Temas claro, escuro e sépia
• Ajuste de fonte, espaçamento e largura
• Barra de progresso de leitura

🔗 INTEGRAÇÃO COM APIS
• Exporte snippets diretamente para GitHub Gists
• Análise de código com OpenAI (sugere descrições e melhorias)
• Suporte a endpoint de API personalizada

Todos os dados ficam armazenados localmente no seu navegador.
```

### Política de Privacidade (obrigatória)
Crie uma página de política de privacidade com o seguinte conteúdo mínimo:

```
Esta extensão armazena todos os dados (snippets, configurações, chaves de API) 
exclusivamente no armazenamento local do navegador (chrome.storage.local).
Nenhum dado é coletado, transmitido ou compartilhado com terceiros, 
exceto quando o usuário explicitamente usa as integrações de API (GitHub, OpenAI)
com credenciais próprias.
```

## Permissões Utilizadas

| Permissão | Motivo |
|---|---|
| `storage` | Salvar snippets e configurações localmente |
| `activeTab` | Enviar mensagens para a aba atual (modo foco) |
| `scripting` | Injetar conteúdo via ação de extensão |
| `contextMenus` | Menu "Salvar como Snippet" ao clicar com botão direito |
| `notifications` | Confirmar salvamento de snippet |
| `clipboardWrite` | Copiar snippet para área de transferência |
| `host_permissions` | Comunicação com GitHub API e OpenAI API |

## Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Alt+F` | Ativar/desativar modo foco |
| `Alt+S` | Salvar seleção como snippet |
| `Esc` | Fechar modo foco |

## Tecnologias

- **TypeScript 5** — tipagem estática
- **React 18** — interface do popup e opções
- **Webpack 5** — bundling
- **Chrome Extensions Manifest V3** — service worker, content scripts
- **chrome.storage.local** — persistência de dados
