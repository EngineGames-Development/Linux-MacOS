const workspace = document.getElementById('workspace');
const spotlight = document.getElementById('spotlight');
const spotlightInput = document.getElementById('spotlightInput');
const clock = document.getElementById('clock');

const appTemplates = {
  terminal: {
    title: 'Terminal',
    content:
      '<pre class="text-sm text-emerald-300">user@hyprmac:~$ neofetch\nOS: HyprMac 1.0\nWM: Hyprland x Aqua\nShell: zsh\n</pre>',
  },
  browser: {
    title: 'Browser',
    content:
      '<div class="text-sm text-white/90">Welcome to HyprMac Browser.<br />Try opening multiple apps to see dynamic tiling.</div>',
  },
  settings: {
    title: 'Settings',
    content:
      '<ul class="space-y-2 text-sm text-white/90"><li>• Appearance: Glassmorphism</li><li>• Layout: Dynamic Tile</li><li>• Shortcuts: Cmd/Ctrl+Space, Alt+Q</li></ul>',
  },
};

let activeWindowId = null;
let windowCounter = 0;
const windows = [];

function updateClock() {
  if (!clock) return;
  clock.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relayoutWindows() {
  const count = windows.length;

  if (!count) {
    workspace.style.gridTemplateColumns = '';
    workspace.replaceChildren();
    activeWindowId = null;
    return;
  }

  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);

  workspace.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  workspace.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  workspace.replaceChildren(...windows.map((windowState) => windowState.element));
}

function setActiveWindow(id) {
  activeWindowId = id;
  windows.forEach(({ id: windowId, element }) => {
    const isActive = windowId === id;
    element.classList.toggle('ring-2', isActive);
    element.classList.toggle('ring-sky-300/80', isActive);
  });
}

function closeWindow(id) {
  const index = windows.findIndex((windowState) => windowState.id === id);
  if (index < 0) return;

  windows.splice(index, 1);
  const nextActive = windows[Math.max(0, index - 1)]?.id ?? null;
  relayoutWindows();
  if (nextActive) setActiveWindow(nextActive);
}

function createWindow(appKey) {
  const template = appTemplates[appKey];
  if (!template) return;

  windowCounter += 1;
  const id = `window-${windowCounter}`;
  const element = document.createElement('article');
  element.className =
    'group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/15 shadow-glow backdrop-blur-xl transition-all duration-300 hover:bg-white/20';
  element.dataset.windowId = id;
  element.innerHTML = `
    <header class="flex items-center justify-between border-b border-white/15 px-3 py-2">
      <div class="flex items-center gap-2">
        <button type="button" class="close-btn h-3 w-3 rounded-full bg-red-400" aria-label="Close ${template.title}" title="Close"></button>
        <span class="h-3 w-3 rounded-full bg-yellow-400"></span>
        <span class="h-3 w-3 rounded-full bg-green-400"></span>
      </div>
      <span class="truncate text-xs font-medium text-white/80">${template.title}</span>
      <span class="w-10"></span>
    </header>
    <div class="min-h-0 flex-1 overflow-auto p-4">${template.content}</div>
  `;

  element.addEventListener('mousedown', () => setActiveWindow(id));
  element.querySelector('.close-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    closeWindow(id);
  });

  windows.push({ id, appKey, element });
  relayoutWindows();
  setActiveWindow(id);
}

function toggleSpotlight(forceState) {
  const shouldShow = forceState ?? spotlight.classList.contains('hidden');
  spotlight.classList.toggle('hidden', !shouldShow);
  spotlight.classList.toggle('flex', shouldShow);
  spotlight.classList.toggle('pointer-events-none', !shouldShow);
  spotlight.setAttribute('aria-hidden', String(!shouldShow));
  if (shouldShow) {
    spotlightInput.focus();
    spotlightInput.select();
  }
}

document.querySelectorAll('[data-app]').forEach((button) => {
  button.addEventListener('click', () => createWindow(button.dataset.app));
});

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const spotlightShortcut =
    (event.metaKey || event.ctrlKey) && (key === ' ' || event.code === 'Space');
  const closeShortcut = event.altKey && key === 'q';

  if (spotlightShortcut) {
    event.preventDefault();
    toggleSpotlight();
  }

  if (closeShortcut && activeWindowId) {
    event.preventDefault();
    closeWindow(activeWindowId);
  }

  if (key === 'escape' && !spotlight.classList.contains('hidden')) {
    toggleSpotlight(false);
  }
});

spotlight.addEventListener('click', (event) => {
  if (event.target === spotlight) {
    toggleSpotlight(false);
  }
});

updateClock();
setInterval(updateClock, 1000);
