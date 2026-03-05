

const TalkbackJS = (() => {
  // Configuracion
  let config = {
    color: '#6366f1',
    lang: 'es-MX',
    rate: 1.0,
    pitch: 1,
    remember: true,
    tags: ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'B', 'STRONG', 'BLOCKQUOTE','A', 'BUTTON', 'LABEL','TD', 'TH','TD']
  };

  let estaActivo = false;
  let estaHablando = false;
  let estaInicializado = false;
  const synth = window.speechSynthesis;
  
  let ring, widget, toggleInput, statusText;

  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      #talkback-ring {
        position: absolute;
        pointer-events: none;
        border: 3px solid ${config.color};
        border-radius: 8px;
        background-color: ${config.color}15;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 99999;
        display: none;
        box-shadow: 0 0 15px ${config.color}40;
      }
      .talkback-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        padding: 12px 20px;
        border-radius: 50px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 100000;
        font-family: system-ui, -apple-system, sans-serif;
        border: 1px solid rgba(0, 0, 0, 0.05);
        user-select: none;
      }
      .talkback-label { display: flex; flex-direction: column; }
      .talkback-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
      .talkback-status { font-size: 13px; font-weight: 700; color: #475569; }
      .talkback-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
      .talkback-switch input { opacity: 0; width: 0; height: 0; }
      .talkback-slider {
        position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
        background-color: #e2e8f0; transition: .4s; border-radius: 34px;
      }
      .talkback-slider:before {
        position: absolute; content: ""; height: 18px; width: 18px;
        left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;
      }
      input:checked + .talkback-slider { background-color: ${config.color}; }
      input:checked + .talkback-slider:before { transform: translateX(20px); }
    `;
    document.head.appendChild(style);
  };

  const createUI = () => {
    if (document.getElementById('talkback-ring')) return;
    ring = document.createElement('div');
    ring.id = 'talkback-ring';
    document.body.appendChild(ring);

    widget = document.createElement('div');
    widget.className = 'talkback-widget';
    widget.innerHTML = `
      <div class="talkback-label">
        <span class="talkback-title">Asistente</span>
        <span class="talkback-status" id="talkback-status-text">Desactivado</span>
      </div>
      <label class="talkback-switch">
        <input type="checkbox" id="talkback-toggle">
        <span class="talkback-slider"></span>
      </label>
    `;
    document.body.appendChild(widget);

    toggleInput = document.getElementById('talkback-toggle');
    statusText = document.getElementById('talkback-status-text');

    if (config.remember) {
      const saved = localStorage.getItem('talkback_active') === 'true';
      if (saved) {
        toggleInput.checked = true;
        setTalkbackState(true, false); // No hablar la bienvenida al auto-cargar
      }
    }

    toggleInput.addEventListener('change', (e) => setTalkbackState(e.target.checked, true));
  };

  const setTalkbackState = (state, announce = true) => {
    estaActivo = state;
    statusText.innerText = estaActivo ? "Activo" : "Desactivado";
    statusText.style.color = estaActivo ? config.color : "#475569";
    if (config.remember) localStorage.setItem('talkback_active', estaActivo);
    if (!estaActivo) Detener();
    else if (announce) speak("Asistente de lectura activado");
  };

  const showFocus = (el) => {
    const rect = el.getBoundingClientRect();
    ring.style.display = 'block';
    ring.style.top = (rect.top + window.scrollY - 5) + 'px';
    ring.style.left = (rect.left + window.scrollX - 5) + 'px';
    ring.style.width = (rect.width + 10) + 'px';
    ring.style.height = (rect.height + 10) + 'px';
  };

  const hideFocus = () => { if(ring) ring.style.display = 'none'; };

  const speak = (text, element = null) => {
    if (!isActive) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.onstart = () => { estaHablando = true; if (element) showFocus(element); };
    utterance.onend = () => { estaHablando = false; hideFocus(); };
    synth.speak(utterance);
  };

  const Detener = () => { synth.cancel(); estaHablando = false; hideFocus(); };

  const initEvents = () => {
    document.addEventListener('mouseover', (e) => {
      if (!estaActivo || estaHablando || widget.contains(e.target)) return;
      const target = e.target;
      if (config.tags.includes(target.tagName) && target.innerText.trim().length > 1) {
        if (target.children.length < 3) speak(target.innerText, target);
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  };

  const init = (userConfig = {}) => {
    if (estaInicializado) return;
    config = { ...config, ...userConfig };
    injectStyles();
    createUI();
    initEvents();
    estaInicializado = true;
    console.log("%c TalkbackJS Auto-Iniciado ", `background: ${config.color}; color: white; padding: 2px 5px; border-radius: 4px;`);
  };

  // Auto-inicialización al cargar el script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  return { init, enable: () => setTalkbackState(true), disable: () => setTalkbackState(false) };
})();