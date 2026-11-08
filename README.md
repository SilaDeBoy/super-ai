# Super AI — Claude-style Chat

A beautiful Claude-inspired AI chat interface that runs on **GitHub Pages**.

Supports **three modes**:

| Mode | Quality | Needs API key? | Offline? | Notes |
|------|---------|----------------|----------|-------|
| **Puter.js** | High (Claude, GPT, Gemini…) | No | No | Best option. Users sign in with free Puter account |
| **Custom API** | High | Yes (free keys available) | No | Groq, OpenRouter, or Google Gemini |
| **Local Demo** | Low | No | Yes | Works offline, limited answers |

## Quick Start

1. Download / clone this repository
2. Open `index.html` in a browser  
   **or**
3. Upload the files to a GitHub repository and enable **GitHub Pages**

Your live URL will be:  
`https://YOUR-USERNAME.github.io/REPO-NAME/`

## How to use the modes

### 1. Puter.js (Recommended)
- Open **Settings**
- Select **Puter.js**
- Choose a model (Claude Sonnet 4 is a good default)
- Start chatting  
When needed, Puter will ask the visitor to sign in (free).

### 2. Custom API Key
Get a free key from one of these:

- **Groq** → https://console.groq.com (very fast)
- **OpenRouter** → https://openrouter.ai (many free models)
- **Google AI Studio** → https://aistudio.google.com (Gemini)

Then paste the key in Settings.

### 3. Local Demo
Works completely offline. Answers are limited. Useful for testing the UI.

## Files

```
super-ai/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Notes

- All settings and API keys are stored only in the browser (`localStorage`).
- No backend server is required.
- Puter.js is loaded from their CDN.

## License

MIT
