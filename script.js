// ======================
// Super AI - Claude-style Chat
// Supports: Puter.js | Custom API | Local Demo
// ======================

const messagesEl = document.getElementById("messages");
const welcomeEl = document.getElementById("welcome");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const modelInfoEl = document.getElementById("modelInfo");
const chatHistoryEl = document.getElementById("chatHistory");
const newChatBtn = document.getElementById("newChatBtn");
const openSettingsBtn = document.getElementById("openSettings");
const closeSettingsBtn = document.getElementById("closeSettings");
const settingsModal = document.getElementById("settingsModal");
const saveSettingsBtn = document.getElementById("saveSettings");
const modeSelect = document.getElementById("modeSelect");
const puterSettings = document.getElementById("puterSettings");
const apiSettings = document.getElementById("apiSettings");
const localSettings = document.getElementById("localSettings");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// State
let conversation = [];
let isGenerating = false;
let settings = {
  mode: "puter",
  puterModel: "claude-sonnet-4",
  apiProvider: "groq",
  apiKey: "",
  apiModel: ""
};

// Load settings
try {
  const saved = localStorage.getItem("superai-settings");
  if (saved) settings = { ...settings, ...JSON.parse(saved) };
} catch (e) {}

function saveSettingsToStorage() {
  localStorage.setItem("superai-settings", JSON.stringify(settings));
}

function updateUIFromSettings() {
  modeSelect.value = settings.mode;
  document.getElementById("puterModel").value = settings.puterModel || "claude-sonnet-4";
  document.getElementById("apiProvider").value = settings.apiProvider || "groq";
  document.getElementById("apiKey").value = settings.apiKey || "";
  document.getElementById("apiModel").value = settings.apiModel || "";

  puterSettings.classList.toggle("hidden", settings.mode !== "puter");
  apiSettings.classList.toggle("hidden", settings.mode !== "api");
  localSettings.classList.toggle("hidden", settings.mode !== "local");

  const labels = {
    puter: `Puter • ${settings.puterModel || "Claude"}`,
    api: `API • ${settings.apiProvider}`,
    local: "Local Demo"
  };
  modelInfoEl.textContent = labels[settings.mode] || "Super AI";
}

// Mode switching in modal
modeSelect.addEventListener("change", () => {
  const mode = modeSelect.value;
  puterSettings.classList.toggle("hidden", mode !== "puter");
  apiSettings.classList.toggle("hidden", mode !== "api");
  localSettings.classList.toggle("hidden", mode !== "local");
});

// Settings modal
openSettingsBtn.addEventListener("click", () => {
  updateUIFromSettings();
  settingsModal.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

saveSettingsBtn.addEventListener("click", () => {
  settings.mode = modeSelect.value;
  settings.puterModel = document.getElementById("puterModel").value;
  settings.apiProvider = document.getElementById("apiProvider").value;
  settings.apiKey = document.getElementById("apiKey").value.trim();
  settings.apiModel = document.getElementById("apiModel").value.trim();
  saveSettingsToStorage();
  updateUIFromSettings();
  settingsModal.classList.add("hidden");
  setStatus("Settings saved");
});

// Mobile menu
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ======================
// Chat UI helpers
// ======================
function setStatus(text) {
  statusEl.textContent = text;
}

function addMessage(role, content, isTyping = false) {
  welcomeEl?.classList.add("hidden");

  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (isTyping) {
    bubble.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  } else {
    bubble.innerHTML = formatContent(content);
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return { msg, bubble };
}

function formatContent(text) {
  // Very light markdown-ish formatting
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Paragraphs
  html = html.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

  return html;
}

function updateLastBubble(content) {
  const bubbles = messagesEl.querySelectorAll(".message.assistant .bubble");
  const last = bubbles[bubbles.length - 1];
  if (last) {
    last.innerHTML = formatContent(content);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

// ======================
// AI Backends
// ======================

async function callPuter(userMessage) {
  setStatus("Thinking with Puter...");

  // Puter.js is loaded globally as `puter`
  if (typeof puter === "undefined") {
    throw new Error("Puter.js failed to load. Check your internet connection.");
  }

  const model = settings.puterModel || "claude-sonnet-4";

  // Build messages for context
  const messages = conversation.map(m => ({
    role: m.role,
    content: m.content
  }));

  const response = await puter.ai.chat(messages, {
    model: model,
    stream: false
  });

  // puter.ai.chat can return different shapes
  let text = "";
  if (typeof response === "string") {
    text = response;
  } else if (response?.message?.content) {
    text = response.message.content;
  } else if (response?.text) {
    text = response.text;
  } else if (response?.content) {
    text = response.content;
  } else {
    text = JSON.stringify(response);
  }

  return text;
}

async function callAPI(userMessage) {
  if (!settings.apiKey) {
    throw new Error("Please add an API key in Settings.");
  }

  setStatus("Calling API...");

  const provider = settings.apiProvider;
  let url, headers, body, model;

  if (provider === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
    model = settings.apiModel || "llama-3.3-70b-versatile";
    headers = {
      "Authorization": `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json"
    };
    body = {
      model,
      messages: conversation,
      temperature: 0.7,
      max_tokens: 2048
    };
  } else if (provider === "openrouter") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    model = settings.apiModel || "meta-llama/llama-3.3-70b-instruct:free";
    headers = {
      "Authorization": `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href,
      "X-Title": "Super AI"
    };
    body = {
      model,
      messages: conversation,
      temperature: 0.7,
      max_tokens: 2048
    };
  } else if (provider === "gemini") {
    // Gemini uses a different format
    const geminiModel = settings.apiModel || "gemini-2.0-flash";
    url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${settings.apiKey}`;
    headers = { "Content-Type": "application/json" };

    // Convert conversation to Gemini format
    const contents = conversation.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    body = { contents };
  } else {
    throw new Error("Unknown provider");
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();

  if (provider === "gemini") {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  }

  return data.choices?.[0]?.message?.content || "No response";
}

function callLocal(userMessage) {
  // Simple offline demo responses
  const lower = userMessage.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm Super AI running in **Local Demo** mode.\n\nThis mode works completely offline but has limited intelligence. For real Claude-level answers, switch to **Puter.js** or add a free API key in Settings.";
  }

  if (lower.includes("who are you") || lower.includes("what are you")) {
    return "I'm **Super AI** — a Claude-style chat interface that can run on GitHub Pages.\n\nRight now you're using the Local Demo mode. You can switch to stronger modes in Settings:\n\n• **Puter.js** — access real Claude, GPT, Gemini models\n• **API Key** — use free keys from Groq, OpenRouter or Gemini";
  }

  if (lower.includes("code") || lower.includes("python") || lower.includes("javascript")) {
    return "In Local Demo mode I can only give basic help.\n\nHere's a simple example:\n\n```python\ndef reverse_string(s):\n    return s[::-1]\n\nprint(reverse_string(\"hello\"))\n```\n\nFor better code help, switch to Puter or API mode in Settings.";
  }

  if (lower.includes("help")) {
    return "I can help with questions, writing, coding ideas, and more — but this Local mode is limited.\n\n**Tip:** Open Settings (bottom left) and choose:\n1. Puter.js for strong models (no key needed from you)\n2. Custom API Key for Groq / OpenRouter / Gemini";
  }

  // Generic fallback
  return `You said: "${userMessage}"\n\nI'm currently in **Local Demo** mode, so my answers are limited.\n\nTo get much smarter responses (closer to Claude):\n\n1. Click **Settings** (bottom left)\n2. Choose **Puter.js** or **Custom API Key**\n3. Save and try again\n\nPuter.js is recommended — it needs no API key from you.`;
}

// ======================
// Main send logic
// ======================
async function sendMessage(text) {
  if (!text.trim() || isGenerating) return;

  isGenerating = true;
  sendBtn.disabled = true;
  userInput.value = "";
  autoResize();

  // Add user message
  conversation.push({ role: "user", content: text.trim() });
  addMessage("user", text.trim());

  // Add typing indicator
  const { bubble: typingBubble } = addMessage("assistant", "", true);

  try {
    let reply = "";

    if (settings.mode === "puter") {
      reply = await callPuter(text);
    } else if (settings.mode === "api") {
      reply = await callAPI(text);
    } else {
      // Simulate thinking delay
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      reply = callLocal(text);
    }

    conversation.push({ role: "assistant", content: reply });
    updateLastBubble(reply);
    setStatus("Ready");

    // Update history sidebar
    updateHistory();
  } catch (err) {
    console.error(err);
    updateLastBubble(`⚠️ Error: ${err.message}\n\nTry switching mode in Settings or check your connection/API key.`);
    setStatus("Error");
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

function updateHistory() {
  // Simple: show last user message as title
  const lastUser = [...conversation].reverse().find(m => m.role === "user");
  if (!lastUser) return;

  // For demo we just keep one current chat
  chatHistoryEl.innerHTML = "";
  const item = document.createElement("div");
  item.className = "history-item active";
  item.textContent = lastUser.content.slice(0, 40) + (lastUser.content.length > 40 ? "…" : "");
  chatHistoryEl.appendChild(item);
}

// ======================
// Events
// ======================
sendBtn.addEventListener("click", () => sendMessage(userInput.value));

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(userInput.value);
  }
});

userInput.addEventListener("input", autoResize);

function autoResize() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
}

newChatBtn.addEventListener("click", () => {
  conversation = [];
  messagesEl.innerHTML = "";
  // Re-add welcome
  const welcome = document.createElement("div");
  welcome.className = "welcome";
  welcome.id = "welcome";
  welcome.innerHTML = `
    <div class="welcome-icon">✦</div>
    <h1>How can I help you today?</h1>
    <p>I can answer questions, write code, explain concepts, and more.</p>
    <div class="suggestions">
      <button class="suggestion" data-prompt="Explain quantum computing simply">Explain quantum computing simply</button>
      <button class="suggestion" data-prompt="Write a Python function to reverse a string">Write a Python function</button>
      <button class="suggestion" data-prompt="Give me 5 creative startup ideas">Creative startup ideas</button>
      <button class="suggestion" data-prompt="Help me plan a 3-day trip to Zanzibar">Plan a trip to Zanzibar</button>
    </div>
  `;
  messagesEl.appendChild(welcome);
  chatHistoryEl.innerHTML = "";
  setStatus("Ready");
  // Re-bind suggestions
  bindSuggestions();
});

function bindSuggestions() {
  document.querySelectorAll(".suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      sendMessage(btn.dataset.prompt);
    });
  });
}

bindSuggestions();
updateUIFromSettings();
setStatus("Ready");
userInput.focus();
