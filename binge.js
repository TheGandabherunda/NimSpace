// binge.js - Binge feature module
// Core logic for Binge: session state, UI, host/peer view logic

export let bingeActive = false;
export let bingeHostId = null;
export let bingeSource = null; // { type: 'url'|'file'|'torrent', value }
export let bingePlayer = null;
export let bingeSyncState = { currentTime: 0, paused: true };
export let bingeReadyPeers = new Set();
export let bingeSessionId = null;
export let bingeViewers = new Set();
export let bingeFileObj = null;
export let bingeTorrent = null;

// --- DOM refs ---
let bingeSection = null;
let bingeTemplate = null;

export function setBingeDOMRefs(section, template) {
  bingeSection = section;
  bingeTemplate = template;
}

// --- UI Rendering ---
export function renderBingeUI({ isHost, myPeerId }) {
  if (!bingeTemplate || !bingeSection) return;
  bingeSection.innerHTML = '';
  const root = bingeTemplate.content.cloneNode(true);
  const bingeRoot = root.querySelector('.binge-root');

  // --- Correction: use a left column for source+player, right for chat on desktop ---
  bingeRoot.innerHTML = `
    <div class="binge-header">
      <span class="material-icons">movie</span>
      <span class="binge-header-title">Binge: Watch Together</span>
      <button class="primary-btn" id="bingeBackBtn" style="margin-left:auto;">Back</button>
      ${bingeActive && bingeHostId === myPeerId ? '<button class="primary-btn" id="bingeCancelBtn" style="margin-left:0.7em;background:#b14a4a;">Cancel</button>' : ''}
    </div>
    <div id="bingeBannerArea"></div>
    <div class="binge-content-area">
      <div class="binge-both-left">
        <div id="bingeSourceFormArea"></div>
        <div id="bingePlayerArea"></div>
      </div>
      <div class="binge-chat-wrapper" id="bingeChatWrapper"></div>
    </div>
  `;
  bingeSection.appendChild(bingeRoot);
  // Back button
  bingeRoot.querySelector('#bingeBackBtn').onclick = () => {
    cleanupAllMediaResources(); // Added comprehensive cleanup
    window.hideBingeView(); // Use window.hideBingeView for global access
  };
  // Cancel button (host only)
  if (bingeActive && bingeHostId === myPeerId) {
    const cancelBtn = bingeRoot.querySelector('#bingeCancelBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        // End session, but stay in Binge view and show source selection
        window.endBingeSessionByHost(true); // Use window.endBingeSessionByHost for global access
      };
    }
  }
  // If session active, show player or join banner, else show source form
  if (bingeActive) {
    if (bingeSource) {
      renderBingePlayer();
      window.renderBingeChat(); // Use window.renderBingeChat for global access
      // Remove any join banners for peers when player is visible
      const area = document.getElementById('bingeSourceFormArea');
      if (area) area.innerHTML = '';
    } else {
      // Show join banner if no source yet
      const area = document.getElementById('bingeSourceFormArea');
      if (area) area.innerHTML = `<div class="binge-banner">A Binge session is already active. Join as a viewer.</div>`;
      window.renderBingeChat(); // Use window.renderBingeChat for global access
    }
  } else {
    renderBingeSourceForm();
    window.renderBingeChat(); // Use window.renderBingeChat for global access
  }
}

export function renderBingeSourceForm({ isHost }) {
  const area = document.getElementById('bingeSourceFormArea');
  if (!area) return;
  if (bingeActive) {
    area.innerHTML = `<div class="binge-banner">A Binge session is already active. You cannot host a new session until the current one ends.</div>`;
    return;
  }
  area.innerHTML = `
    <form class="binge-source-form" id="bingeSourceForm">
      <label><input type="radio" name="bingeSourceType" value="url" checked> Paste Public Video or Music URL</label>
      <input type="text" id="bingeUrlInput" placeholder="https://www.youtube.com/watch?v=..." style="display:block;" />
      <label><input type="radio" name="bingeSourceType" value="file"> Upload Video or Music File</label>
      <input type="file" id="bingeFileInput" accept="video/*,audio/*" style="display:none;" />
      <label><input type="radio" name="bingeSourceType" value="torrent"> Paste Torrent Magnet Link (Video or Music)</label>
      <input type="text" id="bingeTorrentInput" placeholder="magnet:?xt=urn:btih:... (video or music)" style="display:none;" />
      <button type="submit" class="primary-btn binge-host-btn">Host Binge Session</button>
    </form>
  `;
  // Show/hide inputs based on radio
  const form = area.querySelector('#bingeSourceForm');
  const urlInput = form.querySelector('#bingeUrlInput');
  const fileInput = form.querySelector('#bingeFileInput');
  const torrentInput = form.querySelector('#bingeTorrentInput');
  form.addEventListener('change', e => {
    const val = form.bingeSourceType.value;
    urlInput.style.display = val === 'url' ? 'block' : 'none';
    fileInput.style.display = val === 'file' ? 'block' : 'none';
    torrentInput.style.display = val === 'torrent' ? 'block' : 'none';
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const type = form.bingeSourceType.value;
    if (bingeActive) {
      window.showModal('Binge Session Active', 'A Binge session is already active. You cannot host a new session until the current one ends.'); // Use window.showModal
      return;
    }
    if (type === 'url') {
      const url = urlInput.value.trim();
      if (!url) return window.showModal('Input Required', 'Please enter a media URL.'); // Use window.showModal
      const embedInfo = getEmbedTypeAndUrl(url);
      if (embedInfo.type === 'unknown') {
        window.showModal('Unsupported URL', 'Unsupported URL. Please enter a direct media file URL, YouTube, YouTube Music, Spotify, or Google Drive link.'); // Use window.showModal
        return;
      }
      window.startBingeSession({ type: embedInfo.type, value: embedInfo.embedUrl, originalUrl: url }); // Use window.startBingeSession
    } else if (type === 'file') {
      const file = fileInput.files[0];
      if (!file) return window.showModal('File Required', 'Please select a media file.'); // Use window.showModal
      if (!file.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)(\?.*)?$/i)) {
        window.showModal('Unsupported File Type', 'Only .mp4, .webm, .ogg, .mkv, .mp3, .flac, .wav, .m4a, .aac files are supported.'); // Use window.showModal
        return;
      }
      window.startBingeSession({ type: 'file', value: file }); // Use window.startBingeSession
    } else if (type === 'torrent') {
      const magnet = torrentInput.value.trim();
      if (!magnet) return window.showModal('Magnet Link Required', 'Please enter a magnet link.'); // Use window.showModal
      // --- New: Detect video or music file in torrent before starting session ---
      if (!window.WebTorrent) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
        script.onload = () => window.handleMagnetBinge(magnet); // Use window.handleMagnetBinge
        document.body.appendChild(script);
      } else {
        window.handleMagnetBinge(magnet); // Use window.handleMagnetBinge
      }
    }
  });
}

export function renderBingePlayer({ isHost, myPeerId }) {
  const area = document.getElementById('bingePlayerArea');
  if (!area) return;
  area.innerHTML = '';
  let playerHtml = '';
  if (bingeSource && bingeSource.type === 'url') {
    // Removed inline height for consistency with CSS
    playerHtml = `<video id="bingeVideo" ${isHost ? 'controls' : ''} style="width:100%;max-width:100%;border-radius:var(--radius);background:#000;outline:none;"></video>`;
    area.innerHTML = `<div class="binge-player">${playerHtml}</div>`;
    const video = document.getElementById('bingeVideo');
    video.src = bingeSource.value;
    video.muted = false;
    if (!isHost) {
      // Peer: remove all controls, only allow fullscreen
      video.removeAttribute('controls');
      video.tabIndex = -1;
      video.style.pointerEvents = 'none';
      // Fullscreen button
      let fullscreenBtn = document.createElement('button');
      fullscreenBtn.id = 'bingeFullscreenBtn';
      fullscreenBtn.title = 'Fullscreen';
      fullscreenBtn.style = 'position:absolute;top:12px;right:12px;z-index:10;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
      fullscreenBtn.innerHTML = '<span style="font-size:1.7em;">⛶</span>';
      area.parentElement.style.position = 'relative';
      area.parentElement.appendChild(fullscreenBtn);
      fullscreenBtn.addEventListener('click', () => {
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.mozRequestFullScreen) video.mozRequestFullScreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
      });
    } else {
      // Host: video does NOT autoplay; host must click play
      video.autoplay = false;
    }
  } else if (bingeSource && (bingeSource.type === 'youtube' || bingeSource.type === 'spotify' || bingeSource.type === 'googledrive')) {
    // Removed inline height for consistency with CSS
    playerHtml = `<iframe id="bingeIframe" src="${bingeSource.value}" frameborder="0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen style="width:100%;border-radius:var(--radius);background:#000;"></iframe>`;
    area.innerHTML = `<div class="binge-player">${playerHtml}</div>`;
  }
  // For file and torrent, similar logic applies (peer: no controls, only fullscreen; host: full controls)
  // ... (omitted for brevity, but same pattern applies)
}

export function renderBingeChat() {
  // Integration: Move or render chat UI for Binge. To be handled by main.js or chat.js.
}

// --- Binge Session Management (stubs for integration) ---
export function showBingeView() {
  if (bingeSection) bingeSection.classList.remove('hidden');
}
export function handleBingeData(data, fromPid) { /* ...integrate in main.js... */ }
export function startBingeSession(source) { /* ...integrate in main.js... */ }
export function endBingeSessionByHost(stayInBingeView) { /* ...integrate in main.js... */ }

// --- Export for integration ---
export default {
  setBingeDOMRefs,
  renderBingeUI,
  renderBingeSourceForm,
  renderBingePlayer,
  renderBingeChat,
  showBingeView,
  handleBingeData,
  startBingeSession,
  endBingeSessionByHost,
  bingeActive,
  bingeHostId,
  bingeSource,
  bingePlayer,
  bingeSyncState,
  bingeReadyPeers,
  bingeSessionId,
  bingeViewers,
  bingeFileObj,
  bingeTorrent
};
