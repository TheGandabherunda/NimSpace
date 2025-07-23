// main.js – Apple TV Minimal (Flat) Theme, Theme Toggle, All PeerJS logic preserved

// --------------- Theme logic ---------------
const themeToggleBtn = document.getElementById('themeToggleBtn');
const root = document.documentElement;
const THEME_KEY = 'theme';

// Detect system theme
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function getSavedTheme() {
  return localStorage.getItem(THEME_KEY);
}
function applyTheme(theme) {
  // Remove both theme classes
  root.classList.remove('light-theme');
  themeToggleBtn.classList.remove('light', 'dark');
  if (theme === 'light') {
    root.classList.add('light-theme');
    themeToggleBtn.classList.add('light');
  } else {
    themeToggleBtn.classList.add('dark');
  }
}
function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}
function initTheme() {
  const saved = getSavedTheme();
  const theme = saved || getSystemTheme();
  applyTheme(theme);
  updateToggleUI(theme);
}
function updateToggleUI(theme) {
  // Visually update switch and optional label
  if (theme === 'light') {
    themeToggleBtn.classList.add('light');
    themeToggleBtn.classList.remove('dark');
  } else {
    themeToggleBtn.classList.add('dark');
    themeToggleBtn.classList.remove('light');
  }
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!getSavedTheme())
    applyTheme(e.matches ? 'dark' : 'light');
});
// Event: Toggle theme on button
themeToggleBtn.addEventListener('click', () => {
  const isDark = !root.classList.contains('light-theme');
  const newTheme = isDark ? 'light' : 'dark';
  setTheme(newTheme);
  updateToggleUI(newTheme);
});
document.addEventListener('DOMContentLoaded', initTheme);
initTheme(); // Immediate init

// --------- Stack Expand/Collapse Logic (improved) ---------
const infoStack = document.getElementById('infoStack');
const stackToggleBtn = document.getElementById('stackToggleBtn');
const stackContent = infoStack ? infoStack.querySelector('.stack-content') : null;
const mainElement = document.querySelector('main'); // Get main element

// Tracks if user has manually toggled the stack (prevents auto toggling unless peer count changes)
let manualStackToggle = false;
let lastPeersVisible = false;

function expandStack() {
  infoStack.classList.add('stack-expanded');
  infoStack.classList.remove('stack-collapsed');
  if (stackToggleBtn) stackToggleBtn.querySelector('.stack-toggle-label').textContent = 'Hide details';
}
function collapseStack() {
  infoStack.classList.add('stack-collapsed');
  infoStack.classList.remove('stack-expanded');
  if (stackToggleBtn) stackToggleBtn.querySelector('.stack-toggle-label').textContent = 'Show details';
}

if (stackToggleBtn && infoStack) {
  stackToggleBtn.addEventListener('click', () => {
    if (infoStack.classList.contains('stack-collapsed')) {
      expandStack();
    } else {
      collapseStack();
    }
    manualStackToggle = true; // user overrides auto
  });
}

function autoStackCollapseOnPeers() {
  // Debug log
  console.log('[autoStackCollapseOnPeers] called');
  
  // If on landing page (startBtn visible and not disabled), always expand
  // This condition now checks if startSessionContainer is visible
  if (startSessionContainer && !startSessionContainer.classList.contains('hidden')) {
    console.log('[autoStackCollapseOnPeers] On landing page, expanding stack');
    expandStack();
    lastPeersVisible = false;
    // Hide stackToggleBtn on landing page
    hide(stackToggleBtn);
    return;
  }

  // If peersSection is visible and has at least one peer (not just host), collapse
  const peersSection = document.getElementById('peersSection');
  const peersVisible = peersSection && !peersSection.classList.contains('hidden');
  let peerCount = 0;
  if (peersVisible) {
    // Count peers (excluding host)
    const entries = Object.entries(peerUsernames);
    const hostPid = isHost ? myPeerId : joinPeerId;
    peerCount = entries.filter(([pid, _]) => pid !== hostPid).length;
  }
  console.log(`[autoStackCollapseOnPeers] peersVisible: ${peersVisible}, peerCount: ${peerCount}`);

  // Show stackToggleBtn if a session is active (either host or peer)
  // and there's at least one peer (or it's the host's own session)
  // This logic is now handled by setupConnHandlers and joinMesh/startBtn
  // if (meshStarted || peerCount > 0) {
  //   show(stackToggleBtn);
  // } else {
  //   hide(stackToggleBtn);
  // }

  if (peersVisible && peerCount > 0) {
    console.log('[autoStackCollapseOnPeers] Collapsing stack');
    collapseStack();
    lastPeersVisible = true;
  } else {
    console.log('[autoStackCollapseOnPeers] Expanding stack');
    expandStack();
    lastPeersVisible = false;
  }
}


// Patch updatePeersList to auto-toggle stack when peers connect/disconnect
const origUpdatePeersList = typeof updatePeersList !== 'undefined' ? updatePeersList : null;
window.updatePeersList = function() {
  if (origUpdatePeersList) origUpdatePeersList();
  autoStackCollapseOnPeers();
};

document.addEventListener('DOMContentLoaded', () => {
  lastPeersVisible = false;
  // Initial state: if no joinPeerId, show startBtn centered
  if (!joinPeerId) {
    show(startSessionContainer);
    mainElement.classList.add('center-start-session');
    hide(stackToggleBtn); // Ensure stackToggleBtn is hidden initially
  } else {
    // If joining a session, hide startBtn and hide stackToggleBtn initially
    hide(startSessionContainer);
    mainElement.classList.remove('center-start-session');
    hide(stackToggleBtn); // Hide stackToggleBtn initially when joining
  }
  expandStack(); // Always expand on landing
  autoStackCollapseOnPeers(); // This will handle hiding stackToggleBtn if no peers
  renderChatHistory();
});

// --------------- PeerJS + UI helpers (unchanged except for theme) ---------------
function getPeerIdFromURL() {
  const url = new URL(window.location.href);
  return url.searchParams.get("join");
}
function setStatus(msg) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.innerText = msg;
}
function show(elem) { if (elem) elem.classList.remove("hidden"); }
function hide(elem) { if (elem) elem.classList.add("hidden"); }
function getCurrentTimeStr() { return new Date().toLocaleTimeString(); }
const USER_COLORS = [
  "#1859bb", "#267c26", "#a12c3a", "#8c2cb1", "#b17a2c", "#308898", "#cb482a", "#1f7272", "#b12c8c"
];
function usernameColor(name) {
  if (!name) return "#888";
  let hash = 0;
  for (let i = 0; i < name.length; ++i) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// --------------- State ---------------
let peer = null;
let myPeerId = null;
let joinPeerId = getPeerIdFromURL();
let isHost = false;
let mesh = {};                // pid → { conn, status, backoff, lastPing }
let myUsername = "";
let peerUsernames = {};        // pid → username
let normalChatHistory = [];    // Normal chat history
let bingeChatHistory = [];     // Binge chat history
let chatMode = 'normal';       // 'normal' or 'binge'
let knownMsgIds = new Set();
let meshStarted = false;
let hostStatusOverrides = null;
const fileTransfers = {};
let bingeBroadcastMode = false; // <-- Ensure this is defined globally

// --------------- DOM refs ---------------
const startBtn        = document.getElementById("startBtn");
const startSessionContainer = document.getElementById("startSessionContainer"); // New DOM ref
const sessionInfo     = document.getElementById("sessionInfo");
// Removed peerIdSpan as it's no longer displayed
const linkSection     = document.getElementById("linkSection");
const joinLinkA       = document.getElementById("joinLink");
const qrcodeDiv       = document.getElementById("qrcode");
const qrCodeContainer = document.getElementById("qrCodeContainer"); // New reference for the container
const chatSection     = document.getElementById("chatSection");
const chatArea        = document.getElementById("chatArea");
const chatForm        = document.getElementById("chatForm");
const chatInput       = document.getElementById("chatInput");
const peersSection    = document.getElementById("peersSection");
const peersList       = document.getElementById("peersList");
const usernameSection = document.getElementById("usernameSection");
const usernameForm    = document.getElementById("usernameForm");
const usernameInput   = document.getElementById("usernameInput");
const copyLinkBtn     = document.getElementById("copyLinkBtn");
const fileBtn         = document.getElementById("fileBtn");
const fileInput       = document.getElementById("fileInput");

// Username helpers
let userCount = 0;
let assignedNames = {};
function assignDefaultUsernameToPeer(pid) {
  if (pid === myPeerId && isHost) { assignedNames[pid] = "Host"; return "Host"; }
  if (assignedNames[pid]) return assignedNames[pid];
  userCount += 1;
  const uname = "Peer " + userCount;
  assignedNames[pid] = uname;
  return uname;
}
function assignHostName() {
  assignedNames[myPeerId] = "Host";
  peerUsernames[myPeerId] = "Host";
  myUsername = "Host";
  usernameInput.value = myUsername;
}

// --------------- Chat UI ---------------
function addChatMessage({ senderId, text, username, timestamp, color }) {
  if (!chatArea) return;
  const div = document.createElement("div");
  div.className = "message-tile " + (senderId === myPeerId ? "outgoing" : "incoming");
  div.innerHTML = `
    <div class=\"message-header\">\n      <span class=\"message-user-dot\" style=\"background:${color};\"></span>\n      <span class=\"message-username\">${username}</span>\n      <span class=\"message-timestamp\">${timestamp}</span>\n    </div>\n    <div class=\"message-content\"></div>`;
  div.querySelector(".message-content").textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Render all messages for the current chat
function renderChatHistory() {
  if (!chatArea) return;
  chatArea.innerHTML = "";
  if (chatMode === 'binge') {
    bingeChatHistory.forEach(msg => {
      addChatMessage(msg);
    });
  } else {
    normalChatHistory.forEach(msg => {
      if (msg.type === 'file') {
        addFileMessage(msg);
      } else {
        addChatMessage(msg);
      }
    });
  }
}

// When switching modes, update chatHistory pointer and render
function switchToNormalChat() {
  chatMode = 'normal';
  if (fileBtn) fileBtn.style.display = '';
  if (bingeBtn) bingeBtn.style.display = '';
  renderChatHistory();
}
function switchToBingeChat() {
  chatMode = 'binge';
  if (fileBtn) fileBtn.style.display = 'none';
  if (bingeBtn) bingeBtn.style.display = 'none';
  renderChatHistory();
}

// Patch renderBingeChat to use binge chat
function renderBingeChat() {
  const wrapper = document.getElementById('bingeChatWrapper');
  if (!wrapper) return;
  // Move chatForm and chatArea into binge view
  wrapper.innerHTML = '';
  wrapper.appendChild(chatArea);
  wrapper.appendChild(chatForm);
  chatSection.classList.add('hidden');
  switchToBingeChat();
}

// --------------- Peer List UI ---------------
function getPeerStatus(pid) {
  if (isHost) {
    if (pid === myPeerId) return "connected";
    const entry = mesh[pid];
    if (!entry) return "disconnected";
    if (entry.status === "disconnected") return "disconnected";
    if (entry.conn && entry.conn.open) return "connected";
    return "disconnected";
  }
  // If we have explicit status info from host, use it
  if (hostStatusOverrides) {
    if (pid === joinPeerId) return hostStatusOverrides[pid] || "disconnected";
    return hostStatusOverrides[pid] || "disconnected";
  }
  // If we are still connecting, show connecting
  const entry = mesh[pid];
  if (entry && entry.status === "connecting") return "connecting";
  // Only show session ended if we know for sure (after disconnect event)
  if (pid === joinPeerId && _hostSessionEnded) return "session_ended";
  return "disconnected";
}
function updatePeersList() {
  const list = peersList;
  if (!list) return;
  const entries = Object.entries(peerUsernames);
  const hostPid = isHost ? myPeerId : joinPeerId;
  const hostEntry = entries.find(([pid, _]) => pid === hostPid);
  const peerEntries = entries.filter(([pid, _]) => pid !== hostPid);
  peerEntries.sort((a, b) => {
    const mA = /^Peer (\d+)$/.exec(a[1]);
    const mB = /^Peer (\d+)$/.exec(b[1]);
    if (mA && mB) return Number(mA[1]) - Number(mB[1]);
    if (mA) return -1;
    if (mB) return 1;
    return a[1].localeCompare(b[1], undefined, { numeric: true });
  });
  // --- Collapsed user summary ---
  const collapsedUserSummary = document.getElementById('collapsedUserSummary');
  if (collapsedUserSummary) {
    let peersToShow = peerEntries.slice(0, 3);
    let moreCount = peerEntries.length - peersToShow.length;
    let html = '';
    peersToShow.forEach(([pid, uname]) => {
      const color = usernameColor(uname);
      let status = getPeerStatus(pid);
      html += `<span class='collapsed-user-dot' style='background:${color};border:1.5px solid ${status==="connected"?"#27ae60":"#b14a4a"};'></span>`;
      html += `<span class="collapsed-user-name">${uname}</span>`;
    });
    if (moreCount > 0) {
      html += `<span class='collapsed-user-name'>+${moreCount} more</span>`;
    }
    // Always show host at the start
    if (hostEntry) {
      const [pid, uname] = hostEntry;
      const color = usernameColor(uname);
      let status = getPeerStatus(pid);
      html = `<span class='collapsed-user-dot' style='background:${color};border:1.5px solid ${status==="connected"?"#27ae60":"#b14a4a"};'></span><span class='collapsed-user-name'>${uname}</span>` + html;
    }
    collapsedUserSummary.innerHTML = html;
  }
  // --- Reset manualStackToggle if peer count changes ---
  if (typeof updatePeersList._lastPeerCount === 'undefined') updatePeersList._lastPeerCount = 0;
  if (peerEntries.length !== updatePeersList._lastPeerCount) {
    manualStackToggle = false;
    updatePeersList._lastPeerCount = peerEntries.length;
  }
  list.innerHTML = "";
  if (hostEntry) {
    const [pid, uname] = hostEntry;
    let status = getPeerStatus(pid);
    if (!isHost && !hostStatusOverrides && pid === joinPeerId) status = "connecting";
    let statusText =
      status === "connected" ? "Connected" :
      status === "connecting" ? "Connecting..." :
      status === "session_ended" ? "Session Ended" :
      "Disconnected";
    let statusClass = status;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="peer-color-dot" style="background:${usernameColor(uname)};"></span>
      <span class="peer-username">${uname}</span>
      <!-- Removed peer-id span -->
      <span class="peer-status ${statusClass}">${statusText}</span>`;
    list.appendChild(li);
  }
  peerEntries.forEach(([pid, uname]) => {
    let status = getPeerStatus(pid);
    let statusText =
      status === "connected" ? "Connected" :
      status === "connecting" ? "Connecting..." :
      status === "session_ended" ? "Session Ended" :
      "Disconnected";
    let statusClass = status;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="peer-color-dot" style="background:${usernameColor(uname)};"></span>
      <span class="peer-username">${uname}</span>
      <!-- Removed peer-id span -->
      <span class="peer-status ${statusClass}">${statusText}</span>`;
    list.appendChild(li);
  });
  if (!isHost && getPeerStatus(joinPeerId) === "session_ended") {
    setStatus("Session ended - Host disconnected");
  } else if (!isHost && getPeerStatus(joinPeerId) === "connecting") {
    setStatus("Connecting to host...");
  }
}
function getAllStatuses() {
  const m = {};
  Object.keys(peerUsernames).forEach(pid => (m[pid] = getPeerStatus(pid)));
  return m;
}
function broadcastUserListWithStatus() {
  if (!isHost) return;
  const payload = { type: "userlist", users: { ...peerUsernames }, statuses: getAllStatuses() };
  Object.values(mesh).forEach(ent => {
    if (ent.conn && ent.conn.open && ent.status === "connected") {
      try { ent.conn.send(payload); } catch (_) {}
    }
  });
}

// --------------- Networking ---------------
function broadcastData(msg, exceptPeerId = null) {
  Object.entries(mesh).forEach(([pid, ent]) => {
    if (pid === exceptPeerId) return;
    if (ent.conn && ent.conn.open && ent.status === "connected") {
      try { ent.conn.send(msg); } catch (_) {}
    }
  });
  if (msg && msg.type === 'file') {
    if (!normalChatHistory.find(m => m.type === 'file' && m.fileMsgId === msg.fileMsgId)) { // Changed chatHistory to normalChatHistory
      normalChatHistory.push(msg);
    }
  }
}
function sendHistoryToPeer(conn) {
  if (conn && conn.open) {
    try {
      // Ensure all file messages in normalChatHistory have type: 'file' and a msgId
      const normalWithFileType = normalChatHistory.map(msg => {
        if (msg && msg.fileMsgId) { // Added null/undefined check for msg
          let newMsg = { ...msg };
          if (!newMsg.type) newMsg.type = 'file';
          if (!newMsg.msgId) newMsg.msgId = `filemsg-${newMsg.fileMsgId}`;
          return newMsg;
        }
        return msg;
      });
      conn.send({
        type: "history",
        normal: normalWithFileType,
        binge: bingeChatHistory,
        bingeActive,
        bingeHostId,
        bingeSource,
        bingeSessionId
      });
    } catch (_) {}
  }
}

// --------------- Connection handlers ---------------
function setupConnHandlers(conn, pid, isIncoming) {
  const entry = (mesh[pid] = mesh[pid] || { status: "connecting", backoff: 1000, lastPing: Date.now() });
  entry.conn = conn;
  if (conn._setupDone) return;
  conn._setupDone = true;

  conn.on("open", () => {
    entry.status = "connected";
    entry.backoff = 1000;
    entry.lastPing = Date.now();
    // Always assign a username for the peer before updating the list
    if (!peerUsernames[pid]) peerUsernames[pid] = assignDefaultUsernameToPeer(pid);
    else assignDefaultUsernameToPeer(pid); // ensure userCount is correct
    updatePeersList();
    setStatus("Connected to: " + peerUsernames[pid]); // Display username instead of PID
    if (isHost) {
      if (Object.keys(peerUsernames).length === 1) assignHostName();
      if (pid !== myPeerId) {
        conn.send({
          type: "assignName",
          username: peerUsernames[pid],
          peerId: pid,
          allStatuses: getAllStatuses()
        });
      }
      broadcastUserListWithStatus();
      sendHistoryToPeer(conn);
      // Send Binge session info if active
      if (bingeActive && bingeHostId && bingeSource && bingeSessionId) {
        try {
          conn.send({
            type: 'binge-session-info',
            bingeActive,
            bingeHostId,
            bingeSource: { ...bingeSource }, // Send a copy to avoid mutation issues
            bingeSessionId
          });
          // Immediately send current playback state to the new peer if host is playing
          sendBingeStateToPeer(pid); // ADDED: Send current playback state to new peer
        } catch (_) {}
      }
    } else {
      if (myUsername && conn.open) {
        conn.send({ type: "username", username: myUsername, reqUserList: true });
      }
    }
    // Show stackToggleBtn when a peer connects
    show(stackToggleBtn);
  });
  function handleDisconnect() {
    entry.status = "disconnected";
    if (hostStatusOverrides) hostStatusOverrides[pid] = "disconnected";
    // Only set session ended if this is the host and we're not the host
    if (pid === joinPeerId && !isHost) {
      _hostSessionEnded = true;
      setStatus("Session ended - Host disconnected");
      hostStatusOverrides = null;
      updatePeersList();
      return;
    }
    updatePeersList();
    if (isHost) broadcastUserListWithStatus();
    scheduleReconnect(pid);
  }
  conn.on("close", handleDisconnect);
  conn.on("error", handleDisconnect);
  conn.on("data", data => {
    entry.lastPing = Date.now();
    if (data && data.type === "ping") { conn.send({ type: "pong" }); return; }
    if (data && data.type === "pong") return;
    onDataReceived(data, pid, conn);
  });
}
function tryConnectTo(pid, backoff = 1000) {
  if (pid === myPeerId) return;
  const entry = mesh[pid] || (mesh[pid] = {});
  if (entry.status === "connected" || (entry.conn && entry.conn.open)) return;
  const conn = peer.connect(pid, { reliable: true });
  Object.assign(entry, { conn, status: "connecting", backoff, lastPing: Date.now() });
  updatePeersList();
  setupConnHandlers(conn, pid, false);
}
function scheduleReconnect(pid) {
  const entry = mesh[pid];
  if (!entry || entry.reconnect) return;
  entry.backoff = Math.min((entry.backoff || 1000) * 2, 30000);
  entry.reconnect = setTimeout(() => {
    entry.reconnect = null;
    tryConnectTo(pid, entry.backoff);
  }, entry.backoff);
}

// --------------- Data handling ---------------
function onDataReceived(data, fromPid, conn) {
  if (data && data.type === "assignName" && data.username && data.peerId) {
    if (data.peerId === myPeerId) {
      myUsername = data.username;
      usernameInput.value = myUsername;
    }
    peerUsernames[data.peerId] = data.username;
    assignedNames[data.peerId] = data.username;
    updatePeersList();
    return;
  }
  if (data && data.type === "userlist" && data.users) {
    peerUsernames = { ...data.users };
    hostStatusOverrides = data.statuses || null;
    updatePeersList();
    return;
  }
  if (data && data.type === "username" && typeof data.username === "string") {
    const pid = data.peerId || fromPid;
    const newName = data.username.substring(0, 20);
    peerUsernames[pid] = newName;
    assignedNames[pid] = newName;
    updatePeersList();
    if (isHost) broadcastUserListWithStatus();
    return;
  }
  if (data && data.type === "chat" && data.text && data.msgId) {
    if (knownMsgIds.has(data.msgId)) return;
    knownMsgIds.add(data.msgId);
    const msg = {
      senderId: data.senderId || data.meshFrom || fromPid,
      text: data.text,
      username: data.username || peerUsernames[fromPid] || fromPid,
      timestamp: data.timestamp || getCurrentTimeStr(),
      color: usernameColor(data.username || peerUsernames[fromPid] || fromPid),
      msgId: data.msgId
    };
    if (data.chatMode === 'binge') {
      bingeChatHistory.push(msg);
      if (chatMode === 'binge') addChatMessage(msg);
    } else {
      normalChatHistory.push(msg);
      if (chatMode === 'normal') addChatMessage(msg);
    }
    broadcastData(data, data.senderId || data.meshFrom);
    return;
  }
  if (data && data.type === "history" && (Array.isArray(data.normal) || Array.isArray(data.binge))) {
    // Merge both histories
    let addedFile = false;
    if (Array.isArray(data.normal)) {
      data.normal.forEach(msg => {
        if (msg && msg.fileMsgId && !msg.msgId) msg.msgId = `filemsg-${msg.fileMsgId}`;
        if (msg && msg.msgId && !knownMsgIds.has(msg.msgId)) {
          knownMsgIds.add(msg.msgId);
          if (msg.type === 'file') {
            if (!normalChatHistory.find(m => m.type === 'file' && m.fileMsgId === msg.fileMsgId)) {
              normalChatHistory.push(msg);
              addedFile = true;
            }
          } else {
            normalChatHistory.push(msg);
          }
        }
      });
    }
    if (Array.isArray(data.binge)) {
      data.binge.forEach(msg => {
        if (msg && msg.msgId && !knownMsgIds.has(msg.msgId)) {
          knownMsgIds.add(msg.msgId);
          bingeChatHistory.push(msg);
        }
      });
    }
    // Update Binge state if present
    if (typeof data.bingeActive !== 'undefined' && data.bingeActive && data.bingeHostId && data.bingeSource && data.bingeSessionId) {
      bingeActive = data.bingeActive;
      bingeHostId = data.bingeHostId;
      bingeSource = data.bingeSource;
      bingeSessionId = data.sessionId;
      // Do NOT auto-showBingeView here
      // Only update state
    }
    // Always render after merging, and ensure file messages are shown in normal chat
    if (chatMode === 'normal' || addedFile) renderChatHistory();
    return;
  }
  if (data && data.type === 'goodbye' && data.peerId) {
    const pid = data.peerId;
    if (mesh[pid]) mesh[pid].status = 'disconnected';
    if (hostStatusOverrides) hostStatusOverrides[pid] = 'disconnected';
    updatePeersList();
    if (isHost) broadcastUserListWithStatus();
    return;
  }
  if (data && data.type === 'file') {
    handleFileMessage(data);
    return;
  }
  if (data && data.type === 'binge-session-info' && data.bingeActive && data.bingeHostId && data.bingeSource && data.bingeSessionId) {
    bingeActive = data.bingeActive;
    bingeHostId = data.bingeHostId;
    bingeSource = data.bingeSource;
    bingeSessionId = data.sessionId;
    // Forward binge-session-info to all peers except the sender
    Object.entries(mesh).forEach(([pid, ent]) => {
      if (pid !== fromPid && ent.conn && ent.conn.open && ent.status === 'connected') {
        try {
          ent.conn.send(data);
        } catch (_) {}
      }
    });
    showBingeView(); // Show Binge section
    renderBingeUI(); // Force re-render with latest state
    
    // ADDED: If peer (not host) opens Binge view and session is active, request session info from host
    if (!isHost && bingeActive) { 
        broadcastData({ type: 'binge-ready', peerId: myPeerId, hostId: bingeHostId }); 
        console.log('[BINGE][PEER] Sent binge-ready to host.');
    }
    return;
  }
  if (data && data.type === 'binge-join' && bingeHostId === myPeerId && bingeSource && bingeSource.type === 'file') {
    // Re-broadcast binge-start with file meta to the new peer
    if (mesh[fromPid] && mesh[fromPid].conn && mesh[fromPid].conn.open) {
      mesh[fromPid].conn.send({ type: 'binge-start', hostId: myPeerId, source: { ...bingeSource }, sessionId: bingeSessionId });
    }
  }
}

// --------------- Goodbye on unload ---------------
window.addEventListener('unload', () => {
  broadcastData({ type: 'goodbye', peerId: myPeerId });
});

// --------------- Keep-alive ---------------
function startKeepAlive() {
  setInterval(() => {
    Object.entries(mesh).forEach(([pid, entry]) => {
      if (entry.status === "connected" && entry.conn && entry.conn.open) {
        try { entry.conn.send({ type: "ping" }); } catch (_) {}
      }
      if (Date.now() - (entry.lastPing || 0) > 4000 && entry.status === "connected") {
        if (hostStatusOverrides) hostStatusOverrides[pid] = 'disconnected';
        entry.status = "disconnected";
        updatePeersList();
        setStatus("Lost connection to: " + peerUsernames[pid]); // Display username instead of PID
        if (isHost) broadcastUserListWithStatus();
        scheduleReconnect(pid);
      }
    });
    if (isHost && myPeerId) updatePeersList();
  }, 1500);
}

// --------------- Event Listeners ---------------
startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  setStatus("Starting…");
  isHost = true;
  meshStarted = true;
  peerUsernames = {};
  assignedNames = {};
  userCount = 0;
  peer = new Peer(undefined, { debug: 2 });
  peer.on("open", id => {
    myPeerId = id;
    // peerIdSpan.textContent = id; // Removed this line
    show(sessionInfo);
    show(usernameSection);
    assignHostName();
    setStatus("Waiting for connections…");
    const url = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(id)}`;
    joinLinkA.href = url;
    joinLinkA.textContent = url;
    show(linkSection);
    // Display QR code only for the host
    if (isHost) {
      show(qrCodeContainer); // Show the QR code container for the host
      new QRCode(qrcodeDiv, {
        text: url,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
        margin: 2
      });
    } else {
      hide(qrCodeContainer); // Hide the QR code container for peers
    }
    peer.on("connection", conn => {
      const pid = conn.peer;
      mesh[pid] = { conn, status: "connecting", backoff: 1000, lastPing: Date.now() };
      show(chatSection);
      show(peersSection);
      setupConnHandlers(conn, pid, true);
      collapseStack(); // Always collapse stack as soon as a peer connects
    });
    peer.on("disconnected", () => setStatus("Disconnected from PeerJS server"));
    peer.on("error", err => console.error("PeerJS error:", err));
    
    // Once session starts, hide startSessionContainer and remove centering
    hide(startSessionContainer);
    mainElement.classList.remove('center-start-session');
    hide(stackToggleBtn); // Hide stackToggleBtn when session starts, show only on peer connect
  });
  startKeepAlive();
});
function joinMesh() {
  setStatus("Connecting…");
  meshStarted = true;
  peer = new Peer(undefined, { debug: 2 });
  peer.on("open", id => {
    myPeerId = id;
    // peerIdSpan.textContent = id; // Removed this line
    show(sessionInfo);
    show(usernameSection);
    show(chatSection);
    show(peersSection);
    // Hide QR code for peers
    hide(qrCodeContainer);
    const url = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(joinPeerId)}`;
    joinLinkA.href = url;
    joinLinkA.textContent = url;
    show(linkSection);

    const conn = peer.connect(joinPeerId, { reliable: true });
    mesh[joinPeerId] = { conn, status: "connecting", backoff: 1000, lastPing: Date.now() };
    setupConnHandlers(conn, joinPeerId, false);
    collapseStack(); // Always collapse stack as soon as a peer connects
    
    // Once session starts, hide startSessionContainer and remove centering
    hide(startSessionContainer);
    mainElement.classList.remove('center-start-session');
    hide(stackToggleBtn); // Hide stackToggleBtn when session starts, show only on peer connect
  });
  peer.on("connection", conn => {
    const pid = conn.peer;
    mesh[pid] = { conn, status: "connecting", backoff: 1000, lastPing: Date.now() };
    setupConnHandlers(conn, pid, true);
    collapseStack(); // Always collapse stack as soon as a peer connects
  });
  peer.on("disconnected", () => setStatus("Disconnected from PeerJS server"));
  peer.on("error", err => console.error("PeerJS error:", err));
  startKeepAlive();
}
if (joinPeerId) { hide(startSessionContainer); mainElement.classList.remove('center-start-session'); joinMesh(); }
usernameForm.addEventListener("submit", e => {
  e.preventDefault();
  const val = usernameInput.value.trim();
  if (!val) { usernameInput.value = myUsername; return; }
  myUsername = val.substring(0, 20);
  usernameInput.value = myUsername;
  peerUsernames[myPeerId] = myUsername;
  assignedNames[myPeerId] = myUsername;
  updatePeersList();
  broadcastData({ type: "username", username: myUsername, peerId: myPeerId });
  if (isHost) broadcastUserListWithStatus();
});
chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  const msgId = `${myPeerId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const msg = {
    senderId: myPeerId,
    text,
    username: myUsername,
    timestamp: getCurrentTimeStr(),
    color: usernameColor(myUsername),
    msgId
  };
  if (chatMode === 'binge') {
    bingeChatHistory.push(msg);
  } else {
    normalChatHistory.push(msg);
  }
  addChatMessage(msg);
  knownMsgIds.add(msgId);
  broadcastData({
    type: "chat",
    ...msg,
    chatMode
  });
  chatInput.value = "";
  chatInput.focus();
});

// --------------- File Transfer UI ---------------
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function addFileMessage({ fileMsgId, fileName, fileSize, senderId, username, timestamp }) {
  if (!chatArea) return;
  if (chatArea.querySelector(`[data-file-msg-id="${fileMsgId}"]`)) return;
  const div = document.createElement('div');
  div.className = 'message-tile file ' + (senderId === myPeerId ? 'outgoing' : 'incoming');
  div.dataset.fileMsgId = fileMsgId;
  div.setAttribute('data-file-msg-id', fileMsgId);
  div.innerHTML = `
    <div class="message-header">
      <span class="message-user-dot" style="background:${usernameColor(username)};"></span>
      <span class="message-username">${username}</span>
      <span class="message-timestamp">${timestamp}</span>
    </div>
    <div class="file-meta-row">
      <span class="material-icons file-icon">insert_drive_file</span>
      <span class="file-name" title="${fileName}">${fileName}</span>
      <span class="file-size">${formatFileSize(fileSize)}</span>
      <button class="file-download-link icon-btn" title="Download" aria-label="Download">
        <span class="material-icons">download</span>
      </button>
      <button class="file-cancel-link icon-btn hidden" title="Cancel" aria-label="Cancel">
        <span class="material-icons">cancel</span>
      </button>
    </div>
    <div class="file-progress-bar hidden"><div class="file-progress-bar-inner"></div></div>
    <div class="file-status-msg" style="font-size:0.92em;"></div>
  `;
  // Only render file messages in normal chat mode
  if (chatMode === 'normal') {
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

// File Picker & Send
fileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const fileMsgId = `${myPeerId}-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
  const msg = {
    type: 'file',
    fileMsgId,
    fileName: file.name,
    fileSize: file.size,
    senderId: myPeerId,
    username: myUsername,
    timestamp: getCurrentTimeStr(),
  };
  addFileMessage(msg);
  if (!fileTransfers[fileMsgId]) fileTransfers[fileMsgId] = {};
  fileTransfers[fileMsgId][myPeerId] = { file, status: 'ready', progress: 0, controller: null };
  fileInput.value = '';
  normalChatHistory.push(msg);
  broadcastData(msg);
});

// File Message Handling
function handleFileMessage(msg) {
  if (!normalChatHistory.find(m => m.type === 'file' && m.fileMsgId === msg.fileMsgId)) {
    normalChatHistory.push(msg);
  }
  if (!fileTransfers[msg.fileMsgId]) fileTransfers[msg.fileMsgId] = {};
  if (!fileTransfers[msg.fileMsgId][myPeerId]) {
    fileTransfers[msg.fileMsgId][myPeerId] = { status: 'ready', progress: 0, controller: null };
  }
  addFileMessage(msg);
  if (!streamSaver) {
    const tile = chatArea.querySelector(`[data-file-msg-id="${msg.fileMsgId}"]`);
    if (tile) {
      updateFileTileUI(tile, { status: 'canceled', progress: 0, error: 'streamSaver.js not loaded. Please reload or contact the host.' });
      // Using custom modal instead of alert()
      showModal('Error', 'File download requires streamSaver.js. Please reload the page or contact the host.');
    }
  }
}

// File Download/Cancel/Progress UI
chatArea.addEventListener('click', async function(e) {
  const downloadBtn = e.target.closest('.file-download-link');
  const cancelBtn = e.target.closest('.file-cancel-link');
  const tile = e.target.closest('.message-tile.file');
  if (!tile) return;
  const fileMsgId = tile.dataset.fileMsgId;
  if (downloadBtn) {
    if (!streamSaver) {
      updateFileTileUI(tile, { status: 'canceled', progress: 0, error: 'streamSaver.js not loaded. Please reload or contact the host.' });
      // Using custom modal instead of alert()
      showModal('Error', 'File download requires streamSaver.js. Please reload the page or contact the host.');
      return;
    }
    startFileDownload(tile, fileMsgId);
  } else if (cancelBtn) {
    cancelFileDownload(tile, fileMsgId);
  }
});

// File Sender: Handle file-request (Per-Connection)
const origSetupConnHandlers = setupConnHandlers;
setupConnHandlers = function(conn, pid, isIncoming) {
  origSetupConnHandlers(conn, pid, isIncoming);
  let activeFileSenders = {};
  conn.on('data', async data => {
    if (data && data.type === 'file-request' && data.fileMsgId) {
      const fileMsgId = data.fileMsgId;
      if (!fileTransfers[fileMsgId] || !fileTransfers[fileMsgId][myPeerId] || !fileTransfers[fileMsgId][myPeerId].file) {
        conn.send({ type: 'file-error', error: 'File not found', fileMsgId });
        conn.close();
        return;
      }
      const file = fileTransfers[fileMsgId][myPeerId].file;
      const chunkSize = 1024 * 1024; // 1 MB
      const windowSize = 4;
      let offset = 0;
      let canceled = false;
      let awaitingAcks = 0;
      let nextChunkId = 0;
      let lastAckedChunkId = -1;
      let chunkAckMap = {};
      let retriesMap = {};
      let maxRetries = 5;
      let ackTimeouts = {};
      let totalChunks = Math.ceil(file.size / chunkSize);
      activeFileSenders[fileMsgId] = () => { canceled = true; };
      conn.on('data', d => {
        if (d && d.type === 'file-cancel' && d.fileMsgId === fileMsgId) {
          canceled = true;
          conn.close();
        }
        if (d && d.type === 'chunk-ack' && d.fileMsgId === fileMsgId && typeof d.chunkId === 'number') {
          if (!chunkAckMap[d.chunkId]) {
            chunkAckMap[d.chunkId] = true;
            awaitingAcks--;
            if (ackTimeouts[d.chunkId]) { clearTimeout(ackTimeouts[d.chunkId]); delete ackTimeouts[d.chunkId]; }
            lastAckedChunkId = Math.max(lastAckedChunkId, d.chunkId);
          }
        }
        if (d && d.type === 'file-complete' && d.fileMsgId === fileMsgId) {
          conn.close();
        }
      });
      let chunkId = 0;
      while (offset < file.size && !canceled) {
        while (awaitingAcks >= windowSize && !canceled) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        if (canceled) break;
        const slice = file.slice(offset, offset + chunkSize);
        const chunk = await slice.arrayBuffer();
        conn.send({ type: 'file-chunk', data: chunk, chunkId, fileMsgId });
        awaitingAcks++;
        retriesMap[chunkId] = 0;
        ackTimeouts[chunkId] = setTimeout(function retryChunk() {
          if (!chunkAckMap[chunkId] && !canceled) {
            retriesMap[chunkId]++;
            if (retriesMap[chunkId] > maxRetries) {
              conn.send({ type: 'file-error', error: 'Receiver not responding', fileMsgId });
              conn.close();
              canceled = true;
            } else {
              conn.send({ type: 'file-chunk', data: chunk, chunkId, fileMsgId });
              ackTimeouts[chunkId] = setTimeout(retryChunk, 7000);
            }
          }
        }, 7000);
        offset += chunkSize;
        chunkId++;
      }
      while (awaitingAcks > 0 && !canceled) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (!canceled) {
        conn.send({ type: 'file-end', fileMsgId });
      }
      setTimeout(() => { conn.close(); }, 10000);
    }
    if (data && data.type === 'file-cancel' && data.fileMsgId) {
      if (activeFileSenders[data.fileMsgId]) {
        activeFileSenders[data.fileMsgId]();
        delete activeFileSenders[data.fileMsgId];
      }
      conn.close();
    }
  });
};
async function startFileDownload(tile, fileMsgId) {
  if (!fileTransfers[fileMsgId]) fileTransfers[fileMsgId] = {};
  if (fileTransfers[fileMsgId][myPeerId] && fileTransfers[fileMsgId][myPeerId].controller) {
    fileTransfers[fileMsgId][myPeerId].controller.abort();
  }
  fileTransfers[fileMsgId][myPeerId] = {
    status: 'downloading',
    progress: 0,
    controller: new AbortController(),
    conn: null,
    cancel: null
  };
  updateFileTileUI(tile, { status: 'downloading', progress: 0 });
  const fileMsg = findFileMsgInChat(fileMsgId);
  if (!fileMsg) return;
  const senderId = fileMsg.senderId;
  const conn = peer.connect(senderId, { reliable: true, metadata: { fileMsgId, action: 'download' } });
  fileTransfers[fileMsgId][myPeerId].conn = conn;
  conn.on('open', () => { conn.send({ type: 'file-request', fileMsgId }); });
  let fileWriter, received = 0, total = fileMsg.fileSize;
  let streamSaver = window.streamSaver;
  if (!streamSaver) {
    updateFileTileUI(tile, { status: 'canceled', progress: 0, error: 'streamSaver.js not loaded' });
    conn.close();
    return;
  }
  let writableStream = streamSaver.createWriteStream(fileMsg.fileName, { size: total });
  fileWriter = writableStream.getWriter();
  let downloadAborted = false;
  let chunkAckTimeout = null;
  function sendAck(chunkId) { conn.send({ type: 'chunk-ack', fileMsgId, chunkId }); }
  function sendFileComplete() { conn.send({ type: 'file-complete', fileMsgId }); }
  function abortDownload(errorMsg, reason) {
    downloadAborted = true;
    if (fileWriter) fileWriter.abort();
    updateFileTileUI(tile, { status: 'canceled', progress: received / total, error: errorMsg, reason });
    conn.close();
  }
  conn.on('data', async chunk => {
    const transfer = fileTransfers[fileMsgId][myPeerId];
    if (transfer.controller.signal.aborted || downloadAborted) {
      abortDownload('Aborted', 'user');
      return;
    }
    if (chunk.type === 'file-chunk' && chunk.data) {
      try {
        await fileWriter.write(new Uint8Array(chunk.data));
        received += chunk.data.byteLength;
        transfer.progress = received / total;
        updateFileTileUI(tile, { status: 'downloading', progress: transfer.progress });
        sendAck(chunk.chunkId);
        if (chunkAckTimeout) clearTimeout(chunkAckTimeout);
        chunkAckTimeout = setTimeout(() => {
          abortDownload('Timeout waiting for next chunk', 'connection');
        }, 20000);
      } catch (e) {
        abortDownload('Write error', 'error');
      }
    } else if (chunk.type === 'file-end') {
      try {
        await fileWriter.close();
        updateFileTileUI(tile, { status: 'completed', progress: 1 });
        fileTransfers[fileMsgId][myPeerId].status = 'completed';
        sendFileComplete();
        conn.close();
      } catch (e) {
        abortDownload('File close error', 'error');
      }
    } else if (chunk.type === 'file-error') {
      abortDownload(chunk.error || 'Sender error', 'sender');
    }
  });
  conn.on('close', () => {
    if (!downloadAborted && fileTransfers[fileMsgId][myPeerId].status === 'downloading') {
      updateFileTileUI(tile, { status: 'canceled', progress: received / total, reason: 'connection' });
    }
  });
  fileTransfers[fileMsgId][myPeerId].cancel = () => {
    fileTransfers[fileMsgId][myPeerId].controller.abort();
    if (conn && conn.open) conn.send({ type: 'file-cancel', fileMsgId });
    if (fileWriter) fileWriter.abort();
    updateFileTileUI(tile, { status: 'canceled', progress: fileTransfers[fileMsgId][myPeerId].progress, reason: 'user' });
    conn.close();
  };
}
function cancelFileDownload(tile, fileMsgId) {
  if (fileTransfers[fileMsgId] && fileTransfers[fileMsgId][myPeerId] && fileTransfers[fileMsgId][myPeerId].cancel) {
    fileTransfers[fileMsgId][myPeerId].cancel();
  }
}
function updateFileTileUI(tile, { status, progress, error, reason, source }) {
  const downloadBtn = tile.querySelector('.file-download-link');
  const cancelBtn = tile.querySelector('.file-cancel-link');
  const progressBar = tile.querySelector('.file-progress-bar');
  const progressInner = tile.querySelector('.file-progress-bar-inner');
  const statusMsg = tile.querySelector('.file-status-msg');
  if (status === 'downloading') {
    downloadBtn.disabled = true;
    cancelBtn.classList.remove('hidden');
    progressBar.classList.remove('hidden');
    progressInner.style.width = Math.round(progress * 100) + '%';
    statusMsg.textContent = '⬇️ Downloading...';
  } else if (status === 'completed') {
    downloadBtn.disabled = true;
    cancelBtn.classList.add('hidden');
    progressBar.classList.add('hidden');
    statusMsg.textContent = '✅ Download complete';
  } else if (status === 'canceled') {
    downloadBtn.disabled = false;
    cancelBtn.classList.add('hidden');
    progressBar.classList.add('hidden');
    if (reason === 'user') {
      statusMsg.textContent = '❌ Canceled by you';
    } else if (reason === 'sender') {
      statusMsg.textContent = '🚫 Sender canceled the transfer';
    } else if (error) {
      statusMsg.textContent = '❗ Failed: ' + error;
    } else {
      statusMsg.textContent = '❌ Canceled';
    }
  } else {
    downloadBtn.disabled = false;
    cancelBtn.classList.add('hidden');
    progressBar.classList.add('hidden');
    statusMsg.textContent = '';
  }
}
function findFileMsgInChat(fileMsgId) {
  // Always search normalChatHistory for file messages
  return normalChatHistory.find(m => m.type === 'file' && m.fileMsgId === fileMsgId);
}

// Copy join link
if (copyLinkBtn && joinLinkA) {
  copyLinkBtn.addEventListener('click', () => {
    const link = joinLinkA.href;
    if (link && link !== '#') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
          copyLinkBtn.title = 'Copied!';
          const icon = copyLinkBtn.querySelector('.material-icons');
          if (icon) {
            icon.textContent = 'check';
            icon.style.color = '#267c26';
            setTimeout(() => {
              icon.textContent = 'content_copy';
              icon.style.color = '';
              copyLinkBtn.title = 'Copy link';
            }, 1200);
          }
        });
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = link;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        copyLinkBtn.title = 'Copied!';
        const icon = copyLinkBtn.querySelector('.material-icons');
        if (icon) {
          icon.textContent = 'check';
          icon.style.color = '#267c26';
          setTimeout(() => {
            icon.textContent = 'content_copy';
            icon.style.color = '';
            copyLinkBtn.title = 'Copy link';
          }, 1200);
        }
      }
    }
  });
}

// Custom Modal for alerts
function showModal(title, message) {
  let modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center;
      z-index: 10000;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-color); padding: 20px; border-radius: var(--radius); box-shadow: 0 4px 8px rgba(0,0,0,0.2); max-width: 400px; width: 90%; text-align: center;">
        <h3 id="modalTitle" style="color: var(--text-color); margin-bottom: 15px;"></h3>
        <p id="modalMessage" style="color: var(--text-color-secondary); margin-bottom: 20px;"></p>
        <button id="modalCloseBtn" class="primary-btn">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('modalCloseBtn').onclick = () => modal.style.display = 'none';
  }
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  modal.style.display = 'flex';
}

// --------------- Binge Feature ---------------
// Binge state
let bingeActive = false;
let bingeHostId = null;
let bingeSource = null; // { type: 'url'|'file'|'torrent'|'embed', value, fileName (for torrent/file) }
let bingePlayer = null;
let bingeSyncState = { currentTime: 0, paused: true };
let bingeReadyPeers = new Set();
let bingeViewers = new Set();
let bingeSessionId = null;
let bingeFileObj = null;
let bingeTorrent = null; // Peer's WebTorrent client
let _bingeWebTorrent = null; // Host's WebTorrent client
let _bingeCurrentTorrent = null; // Host's current torrent instance
let _bingeCurrentFile = null; // Host's current file instance (from torrent)
let _bingeHostBlobUrl = null; // Host's Blob URL for torrent/file playback
let _hostSessionEnded = false; // Flag for peer to know if host disconnected

const bingeBtn = document.getElementById('bingeBtn');
const bingeSection = document.getElementById('bingeSection');
const bingeTemplate = document.getElementById('bingeTemplate');

// Helper: Show/hide binge view
function showBingeView() {
  hide(chatSection);
  bingeSection.classList.remove('hidden');
  renderBingeUI();
  hide(stackToggleBtn); // Hide stackToggleBtn when entering binge view
  // Unmute and play video if present
  setTimeout(() => {
    const video = document.getElementById('bingeVideo');
    if (video) {
      video.muted = false;
      video.autoplay = false;
      video.controls = true;
      video.pause();
    }
  }, 100);
  // --- ADDED: If peer (not host) opens Binge view and session is active, request session info from host ---
  if (bingeActive && bingeHostId && bingeHostId !== myPeerId) {
    // Send binge-join to host to request session info
    broadcastData({ type: 'binge-join', hostId: bingeHostId, peerId: myPeerId });
  }
}

// Render Binge UI
function renderBingeUI() {
  if (!bingeTemplate || !bingeSection) return;
  bingeSection.innerHTML = '';
  const root = bingeTemplate.content.cloneNode(true);
  const bingeRoot = root.querySelector('.binge-root');
  // Header
  // The crucial change is here to ensure the column structure
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

  // Call ensureAmbientBackground here
  ensureAmbientBackground();

  // Back button
  bingeRoot.querySelector('#bingeBackBtn').onclick = () => {
    cleanupAllMediaResources(); // Added comprehensive cleanup
    hideBingeView();
  };
  // Cancel button (host only)
  if (bingeActive && bingeHostId === myPeerId) {
    const cancelBtn = bingeRoot.querySelector('#bingeCancelBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        // End session, but stay in Binge view and show source selection
        endBingeSessionByHost(true);
      };
    }
  }
  // If session active, show player or join banner, else show source form
  if (bingeActive) {
    if (bingeSource) {
      renderBingePlayer();
      renderBingeChat();
      // Remove any join banners for peers when player is visible
      const area = document.getElementById('bingeSourceFormArea');
      if (area) area.innerHTML = '';
    } else {
      // Show join banner if no source yet
      const area = document.getElementById('bingeSourceFormArea');
      if (area) area.innerHTML = `<div class="binge-banner">A Binge session is already active. Join as a viewer.</div>`;
      renderBingeChat();
    }
  } else {
    renderBingeSourceForm();
    renderBingeChat();
  }
}

// Helper function to load WebTorrent dynamically and ensure it's available
let webTorrentLoaded = false;
let webTorrentLoadingPromise = null;

function loadWebTorrentIfNeeded() {
  if (webTorrentLoaded) {
    return Promise.resolve();
  }
  if (webTorrentLoadingPromise) {
    return webTorrentLoadingPromise;
  }

  webTorrentLoadingPromise = new Promise((resolve, reject) => {
    if (window.WebTorrent) {
      webTorrentLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
    script.onload = () => {
      webTorrentLoaded = true;
      webTorrentLoadingPromise = null; // Reset promise for future calls if needed
      resolve();
    };
    script.onerror = (e) => {
      console.error('Failed to load WebTorrent script:', e);
      webTorrentLoadingPromise = null;
      reject(new Error('WebTorrent script failed to load.'));
    };
    document.body.appendChild(script);
  });
  return webTorrentLoadingPromise;
}


// Render Binge source selection form
function renderBingeSourceForm() {
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
      <div id="bingePeerWarning" style="color:var(--color-accent); font-size:0.9em; margin-top:var(--space-xs); display:none;">
        Make sure all peers are in the binge session before hosting the video.
      </div>
      <button type="submit" class="primary-btn binge-host-btn">Host Binge Session</button>
    </form>
  `;
  // Show/hide inputs based on radio
  const form = area.querySelector('#bingeSourceForm');
  const urlInput = form.querySelector('#bingeUrlInput');
  const fileInput = form.querySelector('#bingeFileInput');
  const torrentInput = form.querySelector('#bingeTorrentInput');
  const bingePeerWarning = form.querySelector('#bingePeerWarning');

  form.addEventListener('change', e => {
    const val = form.bingeSourceType.value;
    urlInput.style.display = val === 'url' ? 'block' : 'none';
    fileInput.style.display = val === 'file' ? 'block' : 'none';
    torrentInput.style.display = val === 'torrent' ? 'block' : 'none';

    if (val === 'file' || val === 'torrent') {
      bingePeerWarning.style.display = 'block';
    } else {
      bingePeerWarning.style.display = 'none';
    }
  });

  // Initial state check for the warning message
  if (form.bingeSourceType.value === 'file' || form.bingeSourceType.value === 'torrent') {
    bingePeerWarning.style.display = 'block';
  } else {
    bingePeerWarning.style.display = 'none';
  }

  form.addEventListener('submit', async e => { // Made async
    e.preventDefault();
    const type = form.bingeSourceType.value;
    if (bingeActive) {
      showModal('Binge Session Active', 'A Binge session is already active. You cannot host a new session until the current one ends.');
      return;
    }
    if (type === 'url') {
      const url = urlInput.value.trim();
      if (!url) return showModal('Input Required', 'Please enter a media URL.');
      const embedInfo = getEmbedTypeAndUrl(url);
      if (embedInfo.type === 'unknown') {
        showModal('Unsupported URL', 'Unsupported URL. Please enter a direct media file URL, YouTube, YouTube Music, Spotify, or Google Drive link.');
        return;
      }
      await startBingeSession({ type: embedInfo.type, value: embedInfo.embedUrl, originalUrl: url }); // Await here
    } else if (type === 'file') {
      const file = fileInput.files[0];
      if (!file) return showModal('File Required', 'Please select a media file.');
      if (!file.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)(\?.*)?$/i)) {
        showModal('Unsupported File Type', 'Only .mp4, .webm, .ogg, .mkv, .mp3, .flac, .wav, .m4a, .aac files are supported.');
        return;
      }
      await startBingeSession({ type: 'file', value: file }); // Await here
    } else if (type === 'torrent') {
      const magnet = torrentInput.value.trim();
      if (!magnet) return showModal('Magnet Link Required', 'Please enter a magnet link.');
      await handleMagnetBinge(magnet); // Await here
    }
  });
}

/**
 * Determines the type of embeddable content and returns the appropriate embed URL.
 * @param {string} url The input URL.
 * @returns {{type: string, embedUrl: string|null}} An object with the type ('youtube', 'spotify', 'video', 'googledrive', 'unknown') and the embed URL.
 */
function getEmbedTypeAndUrl(url) {
  // YouTube and YouTube Music
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([\w-]{11})(?:(?:\?|&)(?:t|start)=(\d+))?/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const startTime = ytMatch[2] ? `&start=${ytMatch[2]}` : '';
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&playsinline=1${startTime}` };
  }

  // Spotify (Track, Album, Playlist, Episode)
  const spotifyTrackMatch = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
  if (spotifyTrackMatch) {
    const type = spotifyTrackMatch[1];
    const id = spotifyTrackMatch[2];
    return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator` };
  }

  // Google Drive
  const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/);
  if (googleDriveMatch) {
    const fileId = googleDriveMatch[1];
    return { type: 'googledrive', embedUrl: `https://docs.google.com/file/d/${fileId}/preview` };
  }

  // Direct video or audio file
  if (url.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)(\?.*)?$/i)) {
    return { type: 'video', embedUrl: url };
  }

  return { type: 'unknown', embedUrl: null };
}


// --- New: Handle magnet link binge (detect video file, then start session) ---
async function handleMagnetBinge(magnet) { // Made async
  const area = document.getElementById('bingeSourceFormArea');
  try {
    await loadWebTorrentIfNeeded(); // Await WebTorrent
  } catch (error) {
    console.error('Error loading WebTorrent for magnet link:', error);
    showModal('Error', 'Failed to load WebTorrent for torrent streaming. Please try again.');
    area.innerHTML += `<div style="color:#b14a4a;padding:1em;">WebTorrent failed to load. Please try again.</div>`;
    return;
  }
  
  try {
    area.innerHTML += '<div style="color:#888;padding:1em;">Fetching torrent metadata...</div>';
    
    // Store client reference globally to prevent garbage collection
    if (_bingeWebTorrent) {
      _bingeWebTorrent.destroy();
    }
    _bingeWebTorrent = new WebTorrent(getWebTorrentConfig(true));
    const client = _bingeWebTorrent;
    
    let errorTimeout = setTimeout(() => {
      area.innerHTML += '<div style="color:#b14a4a;padding:1em;">Could not fetch torrent metadata. Check your magnet link or network.</div>';
      // Don't destroy client here, let it keep trying
    }, 20000);

    client.on('error', (err) => {
      console.error('[MAGNET][HOST] WebTorrent client error:', err);
      // Don't destroy client on error, just log it
      area.innerHTML += `<div style="color:#b14a4a;padding:1em;">WebTorrent error: ${err.message}</div>`;
    });

    client.on('peer', (peer) => {
      console.log('[MAGNET][HOST] Found peer:', peer.id);
    });

    client.on('wire', (wire, addr) => {
      wire.on('error', (err) => {
        console.warn('[MAGNET][HOST] Wire error:', err);
      });
    });

    client.add(magnet, getWebTorrentConfig(), torrent => {
      clearTimeout(errorTimeout);
      
      torrent.on('error', (err) => {
        console.error('[MAGNET][HOST] Torrent error:', err);
        area.innerHTML += `<div style="color:#b14a4a;padding:1em;">Torrent error: ${err.message}</div>`;
        // Don't destroy client, let it keep trying
      });

      const file = torrent.files.find(f => f.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)$/i));
      if (!file) {
        console.error('[MAGNET][HOST] No playable video or music file found in torrent.');
        area.innerHTML += '<div style="color:#b14a4a;padding:1em;">No playable video or music file found in torrent.</div>';
        return;
      }

      // Start Binge session with magnet link and file name
      startBingeSession({ type: 'torrent', value: magnet, fileName: file.name });

      // Play the video file for the host
      file.getBlobURL((err, url) => {
        if (err) {
          console.error('[MAGNET][HOST] Error getting Blob URL:', err);
          area.innerHTML += `<div style="color:#b14a4a;padding:1em;">Error loading media: ${err.message}</div>`;
          return;
        }

        const hostVideoElem = document.getElementById('bingeVideo');
        if (hostVideoElem) {
          hostVideoElem.src = url;
          hostVideoElem.autoplay = false;
          hostVideoElem.pause();
          console.log('[MAGNET][HOST] Host media src set to Blob URL from magnet:', url);
          
          // Store references to prevent garbage collection
          _bingeCurrentTorrent = torrent;
          _bingeCurrentFile = file;
          _bingeHostBlobUrl = url;
        }
      });
    });
  } catch (err) {
    console.error('[MAGNET][HOST] Setup error:', err);
    area.innerHTML += `<div style="color:#b14a4a;padding:1em;">Setup error: ${err.message}</div>`;
  }
}


// --- YouTube IFrame API integration for Binge sync ---
let ytPlayer = null;
let ytPlayerReady = false;
let ytLastState = null;
let ytSyncLock = false;

function loadYouTubeAPI(callback) {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  window.onYouTubeIframeAPIReady = callback;
  document.body.appendChild(tag);
}

function getYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([\w-]{11})(?:(?:\?|&)(?:t|start)=(\d+))?/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const startTime = ytMatch[2] ? `&start=${ytMatch[2]}` : '';
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&playsinline=1${startTime}` };
  }

  // Spotify (Track, Album, Playlist, Episode)
  const spotifyTrackMatch = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
  if (spotifyTrackMatch) {
    const type = spotifyTrackMatch[1];
    const id = spotifyTrackMatch[2];
    return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator` };
  }

  // Google Drive
  const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/);
  if (googleDriveMatch) {
    const fileId = googleDriveMatch[1];
    return { type: 'googledrive', embedUrl: `https://docs.google.com/file/d/${fileId}/preview` };
  }

  // Direct video or audio file
  if (url.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)(\?.*)?$/i)) {
    return { type: 'video', embedUrl: url };
  }

  return { type: 'unknown', embedUrl: null };
}


// --- Binge Host/Viewer Robust Sync ---
// Helper: Send current video state to a peer
function sendBingeStateToPeer(pid) {
  const video = document.getElementById('bingeVideo');
  if (!video && !ytPlayer) return;

  let currentTime = 0;
  let paused = true;
  let playbackRate = 1;

  if (bingeSource.type === 'youtube' && ytPlayer && ytPlayerReady) {
    currentTime = ytPlayer.getCurrentTime();
    paused = ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING;
    playbackRate = ytPlayer.getPlaybackRate();
  } else if (video) {
    currentTime = video.currentTime;
    paused = video.paused;
    playbackRate = video.playbackRate;
  }

  const msg = {
    type: 'binge-sync',
    hostId: myPeerId,
    currentTime: currentTime,
    paused: paused,
    playbackRate: playbackRate,
    sourceType: bingeSource.type // Include source type for specific handling
  };
  if (mesh[pid] && mesh[pid].conn && mesh[pid].conn.open) {
    mesh[pid].conn.send(msg);
  }
}
// Host: Broadcast video state to all peers
function broadcastBingeState() {
  const video = document.getElementById('bingeVideo');
  if (!video && !ytPlayer) return;

  let currentTime = 0;
  let paused = true;
  let playbackRate = 1;

  if (bingeSource.type === 'youtube' && ytPlayer && ytPlayerReady) {
    currentTime = ytPlayer.getCurrentTime();
    paused = ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING;
    playbackRate = ytPlayer.getPlaybackRate();
  } else if (video) {
    currentTime = video.currentTime;
    paused = video.paused;
    playbackRate = video.playbackRate;
  }

  const msg = {
    type: 'binge-sync',
    hostId: myPeerId,
    currentTime: currentTime,
    paused: paused,
    playbackRate: playbackRate,
    sourceType: bingeSource.type // Include source type for specific handling
  };
  broadcastData(msg);
}
// --- Host: Pause/resume torrent seeding based on video state ---
function updateHostTorrentSeeding(paused) {
  if (_bingeWebTorrent && _bingeWebTorrent.torrents && _bingeWebTorrent.torrents[0]) {
    const t = _bingeWebTorrent.torrents[0];
    if (paused) {
      t.pause();
      console.log('[BINGE][DEBUG][HOST] Torrent paused (not seeding)');
    } else {
      t.resume();
      console.log('[BINGE][DEBUG][HOST] Torrent resumed (seeding)');
    }
  }
}
// --- Peer: Pause/resume torrent download based on host state ---
function updatePeerTorrentDownloading(paused) {
  if (bingeTorrent && bingeTorrent.torrents && bingeTorrent.torrents[0]) {
    const t = bingeTorrent.torrents[0];
    if (paused) {
      t.pause();
      console.log('[BINGE][DEBUG][PEER] Torrent paused (not downloading)');
    } else {
      t.resume();
      console.log('[BINGE][DEBUG][PEER] Torrent resumed (downloading)');
    }
  }
}
// --- Patch renderBingePlayer for robust host/viewer logic ---
function renderBingePlayer() {
  // --- If a video element already exists (e.g. live stream active), keep it and avoid rebuilding ---
  const existingPlayerElem = document.getElementById('bingeVideo') || document.getElementById('bingeIframe');
  if (existingPlayerElem) {
    const area = document.getElementById('bingePlayerArea');
    if (area && !area.contains(existingPlayerElem)) {
      area.innerHTML = '';
      area.appendChild(existingPlayerElem);
    }
    return; // Skip normal creation logic
  }
  const area = document.getElementById('bingePlayerArea');
  if (!area) return;
  area.innerHTML = '';
  let playerHtml = '';
  let videoSrc = null; // Used for <video> tag
  let embedSrc = null; // Used for <iframe> tag
  let isPeer = bingeHostId !== myPeerId;
  let isHost = bingeHostId === myPeerId;
  let type = bingeSource.type;
  let debugPrefix = `[BINGE][${isHost ? 'HOST' : 'PEER'}][${type.toUpperCase()}]`;

  // --- Determine player type and source ---
  if (type === 'url' || type === 'video') { // Direct video/audio URL
    videoSrc = bingeSource.value;
    console.log(`${debugPrefix} Video src set to direct URL:`, videoSrc);
    playerHtml = `<video id="bingeVideo" crossorigin="anonymous" style="width:100%;max-width:100%;border-radius:var(--radius);background:#000;outline:none;"></video>`;
  } else if (type === 'file') {
    if (isHost && bingeFileObj) {
      videoSrc = URL.createObjectURL(bingeFileObj);
      console.log(`${debugPrefix} Video src set to Blob URL from file:`, videoSrc);
    } else if (isPeer) {
      videoSrc = null; // Will be set after torrent download
      console.log(`${debugPrefix} Peer will fetch file via torrent (magnet):`, bingeSource.value);
    }
    playerHtml = `<video id="bingeVideo" style="width:100%;max-width:100%;border-radius:var(--radius);background:#000;outline:none;"></video>`;
  } else if (type === 'torrent') {
    if (isHost && _bingeHostBlobUrl) {
      videoSrc = _bingeHostBlobUrl;
      console.log(`${debugPrefix} Host is seeder, video src set to Blob URL:`, videoSrc);
    } else if (isHost && bingeFileObj) {
      videoSrc = URL.createObjectURL(bingeFileObj);
      console.log(`${debugPrefix} Host is seeder, video src set to Blob URL (from bingeFileObj):`, videoSrc);
    } else if (isPeer) {
      videoSrc = null; // Will be set after torrent download
      console.log(`${debugPrefix} Peer will fetch video via torrent:`, bingeSource.value);
    }
    playerHtml = `<video id="bingeVideo" style="width:100%;max-width:100%;border-radius:var(--radius);background:#000;outline:none;"></video>`;
  } else if (type === 'youtube' || type === 'spotify' || type === 'googledrive') { // Embedded content
    embedSrc = bingeSource.value;
    console.log(`${debugPrefix} Embed src set to:`, embedSrc);
    playerHtml = `<iframe id="bingeIframe" src="${embedSrc}" frameborder="0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen style="width:100%;height:400px;border-radius:var(--radius);background:#000;"></iframe>`;
  } else {
    area.innerHTML = `<div style="color:#b14a4a;padding:1em;">Unsupported media type: ${type}</div>`;
    return;
  }

  area.innerHTML = `<div class="binge-player">${playerHtml}</div>`;

  // Set up ambient background for both video and iframe players
  const playerElem = document.getElementById('bingeVideo') || document.getElementById('bingeIframe');
  if (playerElem) {
    setupAmbientBackgroundEffect(playerElem);
  }

  if (type === 'youtube') {
    const iframe = document.getElementById('bingeIframe');
    if (iframe) {
      loadYouTubeAPI(() => {
        ytPlayer = new YT.Player('bingeIframe', {
          events: {
            'onReady': onYouTubePlayerReady,
            'onStateChange': onYouTubePlayerStateChange
          }
        });
      });
    }
  } else if (type === 'spotify' || type === 'googledrive') {
    // Spotify and Google Drive embeds handle their own playback, no direct JS control
    const iframe = document.getElementById('bingeIframe');
    if (iframe) {
      // For spotify/googledrive, we can't directly control playback via JS.
      // We just ensure the iframe is loaded.
      if (isHost) {
        // Host can manually play/pause, peers will just see the same state
        // No sync needed for Spotify/Google Drive, as it's not controllable by the API
      } else {
        // Peers just view the embedded player
      }
    }
  } else { // Video/File/Torrent
    const video = document.getElementById('bingeVideo');
    if (videoSrc) {
      video.src = videoSrc;
      console.log(`${debugPrefix} Set video.src:`, videoSrc);
    }

    if (isHost) {
      video.autoplay = false;
      video.controls = true;
      setupHostBingeVideoEvents(video);
      console.log(`${debugPrefix} Host video element ready, controls enabled.`);
      video.addEventListener('play', () => {
        console.log(`${debugPrefix} Host clicked play.`);
      });
    } else {
      setupViewerBingeVideoEvents(video);
      video.autoplay = false;
      video.pause();
      console.log(`${debugPrefix} Peer video element ready, controls disabled, waiting for sync.`);
      if (!document.getElementById('bingeFullscreenBtn')) {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'bingeFullscreenBtn';
        fullscreenBtn.title = 'Fullscreen';
        fullscreenBtn.style = 'position:absolute;top:12px;right:12px;z-index:10;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
        fullscreenBtn.innerHTML = '<span style="font-size:1.7em;">⛶</span>';
        video.parentElement.style.position = 'relative';
        video.parentElement.appendChild(fullscreenBtn);
        fullscreenBtn.addEventListener('click', () => {
          console.log(`${debugPrefix} Peer clicked fullscreen button.`);
          if (video.requestFullscreen) video.requestFullscreen();
          else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
          else if (video.mozRequestFullScreen) video.mozRequestFullScreen();
          else if (video.msRequestFullscreen) video.msRequestFullscreen();
        });
        console.log(`${debugPrefix} Fullscreen button added for peer.`);
      }
    }

    if (isPeer && (type === 'file' || type === 'torrent')) {
      let magnet = bingeSource.value;
      // Add a loading message for peers when torrent/file is loading
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'bingePeerLoadingMsg';
      loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;';
      loadingDiv.textContent = 'Loading video...';
      area.appendChild(loadingDiv);

      // Ensure WebTorrent is loaded before setting up the peer video
      setupPeerWebTorrentVideo(video, magnet, debugPrefix);
    }
  }
}

// YouTube Player API Callbacks
function onYouTubePlayerReady(event) {
  ytPlayerReady = true;
  console.log('[BINGE][YOUTUBE] Player ready:', event.target);
  // If host, start broadcasting state
  if (bingeHostId === myPeerId) {
    broadcastBingeState();
  }
}

function onYouTubePlayerStateChange(event) {
  if (ytSyncLock) return; // Prevent infinite loops during sync
  console.log('[BINGE][YOUTUBE] Player state changed:', event.data);
  // If host, broadcast state changes
  if (bingeHostId === myPeerId) {
    let action = '';
    if (event.data === YT.PlayerState.PLAYING) {
      action = 'play';
    } else if (event.data === YT.PlayerState.PAUSED) {
      action = 'pause';
    } else if (event.data === YT.PlayerState.ENDED) {
      action = 'ended';
    }
    if (action) {
      broadcastBingeSync(action, ytPlayer.getCurrentTime());
    }
  }
}

// --- Peer: Track added magnet links to avoid duplicate torrent add ---
let addedMagnets = new Set();

// Get WebTorrent tracker list and configuration
function getWebTorrentConfig(includeFullConfig = false) {
  // Primary trackers - most reliable ones first
  const trackers = [
    // UDP trackers (most reliable)
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://tracker.leechers-paradise.org:6969/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.moeking.me:6969/announce',
    'udp://tracker.dler.org:6969/announce',
    // HTTP trackers (reliable fallback)
    'http://tracker.openbittorrent.com:80/announce',
    'http://tracker.opentrackr.org:1337/announce',
    // WebSocket trackers (only most reliable)
    'wss://tracker.btorrent.xyz',
    'wss://tracker.openwebtorrent.com'
  ];

  if (!includeFullConfig) {
    return { announce: trackers };
  }

  return {
    announce: trackers,
    maxConns: 100,
    uploadRateLimit: 204800,
    downloadRateLimit: 2097152,
    maxWebConns: 30,
    webSeeds: true,
    destroyOnError: false,
    strategy: 'rarest',
    verify: true,
    tracker: {
      rtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
          { urls: 'stun:stun.sipgate.net:3478' }
        ],
        sdpSemantics: 'unified-plan',
        bundlePolicy: 'max-bundle',
        iceCandidatePoolSize: 10
      },
      announce: trackers,
      getAnnounceOpts: function() {
        return {
          numwant: 50,  // Request up to 50 peers
          uploaded: 0,
          downloaded: 0,
          left: Infinity,
          compact: 1
        };
      }
    }
  };
}

// Add retry logic for failed connections
async function setupPeerWebTorrentVideo(video, magnet, debugPrefix) { // Made async
  try {
    debugMagnetStream('peer', 'Setting up WebTorrent video player', { magnet });
    await loadWebTorrentIfNeeded(); // Ensure WebTorrent is loaded
    
    // Clear any existing client to prevent memory leaks
    if (bingeTorrent && !bingeTorrent.destroyed) {
      debugMagnetStream('peer', 'Destroying existing WebTorrent client');
      bingeTorrent.destroy();
    }

    bingeTorrent = new WebTorrent(getWebTorrentConfig(true));
    debugMagnetStream('peer', 'Created new WebTorrent client');

    // Add connection error handling
    bingeTorrent.on('error', function(err) {
      console.error('[MAGNET][PEER] Client error:', err);
      // Try to recover from error
      setTimeout(() => {
        if (!bingeTorrent.destroyed) {
          debugMagnetStream('peer', 'Attempting to recover from error');
          bingeTorrent.destroy();
          bingeTorrent = new WebTorrent(getWebTorrentConfig(true));
          bingeTorrent.add(magnet, getWebTorrentConfig(), onTorrent);
        }
      }, 1000);
    });

    if (addedMagnets.has(magnet)) {
      debugMagnetStream('peer', 'WARNING: Magnet already added, skipping');
      return;
    }
    addedMagnets.add(magnet);

    function onTorrent(torrent) {
      debugMagnetStream('peer', 'Got torrent metadata');
      
      // Add individual wire error handling
      torrent.on('wire', function(wire, addr) {
        wire.on('error', function(err) {
          console.warn('[MAGNET][PEER] Wire error:', err);
        });

        wire.on('connect', function() {
          debugMagnetStream('peer', 'Connected to peer:', addr);
        });
      });

      const file = torrent.files.find(f => f.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)$/i));
      if (!file) {
        debugMagnetStream('peer', 'ERROR: No video or music file found in torrent');
        return;
      }

      debugMagnetStream('peer', 'Streaming video or music file:', file.name);

      // Show loading indicator
      const loadingDiv = document.getElementById('bingePeerLoadingMsg'); // Use existing or create
      if (loadingDiv) {
        loadingDiv.textContent = 'Loading video stream...';
      } else {
        const area = document.getElementById('bingePlayerArea');
        if (area) {
          const newLoadingDiv = document.createElement('div');
          newLoadingDiv.id = 'bingePeerLoadingMsg';
          newLoadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;';
          newLoadingDiv.textContent = 'Loading video stream...';
          area.appendChild(newLoadingDiv);
        }
      }

      // Configure video element
      video.addEventListener('loadedmetadata', () => {
        debugMagnetStream('peer', 'Video or music metadata loaded');
        const loadingMsg = document.getElementById('bingePeerLoadingMsg');
        if (loadingMsg) loadingMsg.remove(); // Remove loading message on metadata load
      });

      video.addEventListener('error', (e) => {
        console.error('[MAGNET][PEER] Video or music error:', e.target.error);
        debugMagnetStream('peer', 'Video or music element error:', e.target.error);
      });

      // Enhanced video element setup
      const streamOpts = {
        autoplay: false,
        muted: false,
        controls: true
      };

      file.renderTo(video, streamOpts, (err) => {
        if (err) {
          console.error('[MAGNET][PEER] RenderTo error:', err);
          debugMagnetStream('peer', 'Failed to render video or music:', err);
          return;
        }

        // Force video stream initialization
        video.load();
        
        // Ensure proper video display
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.maxHeight = '100%';
        video.style.backgroundColor = '#000';

        // Add video stream debug info
        debugMagnetStream('peer', 'Video or music stream info:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          networkState: video.networkState
        });
      });

      // Monitor download progress
      let lastProgress = 0;
      torrent.on('download', function(bytes) {
        const currentProgress = (torrent.progress * 100);
        if (currentProgress - lastProgress >= 1 || currentProgress === 100) {
          lastProgress = currentProgress;
          debugMagnetStream('peer', 'Download progress:', {
            progress: currentProgress.toFixed(1) + '%',
            downloadSpeed: formatBytes(torrent.downloadSpeed) + '/s',
            downloaded: formatBytes(torrent.downloaded),
            numPeers: torrent.numPeers,
            connections: torrent.wires.length,
            bufferSize: formatBytes(torrent.downloaded - torrent.uploaded)
          });

          // Update loading indicator
          if (document.getElementById('bingePeerLoadingMsg')) {
            document.getElementById('bingePeerLoadingMsg').textContent = 
              `Loading: ${currentProgress.toFixed(1)}% (${formatBytes(torrent.downloadSpeed)}/s)`;
          }
        }
      });

      // Handle download completion
      torrent.on('done', () => {
        debugMagnetStream('peer', 'Download complete');
        if (document.getElementById('bingePeerLoadingMsg')) {
          document.getElementById('bingePeerLoadingMsg').remove();
        }
      });
    }

    bingeTorrent.add(magnet, getWebTorrentConfig(), onTorrent);
  } catch (err) {
    console.error('[MAGNET][PEER] Setup error:', err);
    debugMagnetStream('peer', 'Critical setup error:', err);
    if (video && video.parentElement) {
      video.parentElement.innerHTML += '<div style="color:#b14a4a;padding:1em;">WebTorrent failed to load for peer. Please reload.</div>';
    }
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- On the peer, do not answer PeerJS media calls for file/torrent binge ---
if (typeof peer !== 'undefined' && peer && typeof peer.on === 'function') {
  peer.on('call', async (mediaCall) => {
    // Only accept media calls if the bingeSection is currently visible
    if (!isBingeScreenVisible()) {
      console.log('[BROADCAST][PEER] Rejecting media call: Binge section not visible.');
      mediaCall.close(); // Explicitly close the call
      return;
    }

    try {
      if (!mediaCall) return;
      mediaCall.answer();
      mediaCall.on('stream', (remoteStream) => {
        console.log('[BROADCAST][PEER] Received host video stream', remoteStream, remoteStream.getTracks());
        let peerVideoElem = document.getElementById('bingeVideo');
        const playerArea = document.getElementById('bingePlayerArea');
        if (!peerVideoElem) {
          peerVideoElem = document.createElement('video');
          peerVideoElem.id = 'bingeVideo';
          peerVideoElem.autoplay = true;
          peerVideoElem.playsInline = true;
          peerVideoElem.style.width = '100%';
          peerVideoElem.style.maxWidth = '100%';
          peerVideoElem.style.borderRadius = 'var(--radius)';
          peerVideoElem.style.background = '#000';
          peerVideoElem.style.outline = 'none';
          if (playerArea) playerArea.appendChild(peerVideoElem);
        }
        peerVideoElem.srcObject = remoteStream;
        // Stop WebTorrent if it's running since we now have live broadcast
        if (bingeTorrent && typeof bingeTorrent.destroy === 'function') {
          try {
            console.log('[BINGE][PEER] Received live broadcast – shutting down WebTorrent');
            bingeTorrent.destroy(() => { console.log('[BINGE][PEER] WebTorrent client destroyed'); });
            bingeTorrent = null;
          } catch (e) {
            console.warn('[BINGE][PEER] Error destroying WebTorrent client:', e);
        }
          }
          peerVideoElem.autoplay = true;
          peerVideoElem.muted = true; // Start muted for autoplay
          peerVideoElem.onloadedmetadata = () => {
            peerVideoElem.play().then(() => {
              peerVideoElem.muted = false; // Unmute after successful play
            }).catch((err) => {
              console.warn('[BROADCAST][PEER] video.play() failed:', err);
            });
          };
          console.log('[BROADCAST][PEER] Set srcObject for peer video element.');
        });
      } catch (err) {
        console.warn('[BROADCAST][PEER] Error answering media call:', err);
      }
    });
}

// Setup video events for host/viewer sync
function setupBingeVideoEvents(video) {
  if (!video) return;
  if (bingeHostId === myPeerId) {
    // Host: broadcast play/pause/seek
    video.onplay = () => broadcastBingeSync('play', video.currentTime);
    video.onpause = () => broadcastBingeSync('pause', video.currentTime);
    video.onseeked = () => broadcastBingeSync('seek', video.currentTime);
    video.onratechange = () => broadcastBingeSync('rate', video.playbackRate);
  } else {
    // Viewer: listen for sync events
    video.onplay = null;
    video.onpause = null;
    video.onseeked = null;
    video.onratechange = null;
  }
}

// Start a Binge session as host
async function startBingeSession(source) { // Made async
  if (bingeActive) return;
  bingeActive = true;
  bingeHostId = myPeerId;
  bingeSource = source;
  bingeSessionId = `${myPeerId}-${Date.now()}`;
  bingeReadyPeers = new Set([myPeerId]);
  bingeViewers = new Set();
  
  if (source.type === 'file') {
    bingeFileObj = source.value;
    const area = document.getElementById('bingePlayerArea');
    if (area) {
      area.innerHTML = '<div id="bingeHostLoadingMsg" style="color:#888;padding:1em;text-align:center;">Preparing file for streaming...</div>';
    }
    try {
      await loadWebTorrentIfNeeded(); // Await WebTorrent
      seedBingeFileWithWebTorrent(bingeFileObj);
    } catch (error) {
      console.error('Error loading WebTorrent for file seeding:', error);
      showModal('Error', 'Failed to load WebTorrent for file streaming. Please try again.');
      endBingeSessionByHost(true); // End session if WebTorrent fails to load
    }
    return; // Wait for seeding before broadcasting
  } else if (source.type === 'youtube' || source.type === 'spotify' || source.type === 'video' || source.type === 'googledrive') {
    // For URL/embed, broadcast immediately
    broadcastData({ type: 'binge-start', hostId: myPeerId, source: { ...source }, sessionId: bingeSessionId });
    // Broadcast chat message to all peers
    const hostName = myUsername || peerUsernames[myPeerId] || 'Host';
    const msg = {
      type: 'chat',
      text: `👤 ${hostName} started a Binge session. Click 🍿 to join.`,
      username: 'System',
      timestamp: getCurrentTimeStr(),
      msgId: `${myPeerId}-binge-${Date.now()}`,
      meshFrom: myPeerId,
      chatMode: 'normal'
    };
    if (!knownMsgIds.has(msg.msgId)) {
      normalChatHistory.push({ senderId: myPeerId, text: msg.text, username: msg.username, timestamp: msg.timestamp, color: '#f4c542', msgId: msg.msgId });
      knownMsgIds.add(msg.msgId);
      broadcastData(msg);
    }
    renderBingeUI();
  } else if (source.type === 'torrent') {
    // This case is handled by handleMagnetBinge which calls startBingeSession with type 'torrent'
    // and then sets up the host video playback after torrent metadata is ready.
    // The broadcast is done inside handleMagnetBinge.
    const hostName = myUsername || peerUsernames[myPeerId] || 'Host';
    const msg = {
      type: 'chat',
      text: `👤 ${hostName} started a Binge session. Click 🍿 to join.`,
      username: 'System',
      timestamp: getCurrentTimeStr(),
      msgId: `${myPeerId}-binge-${Date.now()}`,
      meshFrom: myPeerId,
      senderId: myPeerId,
      chatMode: 'normal'
    };
    if (!knownMsgIds.has(msg.msgId)) {
      normalChatHistory.push({ senderId: myPeerId, text: msg.text, username: msg.username, timestamp: msg.timestamp, color: '#f4c542', msgId: msg.msgId });
      knownMsgIds.add(msg.msgId);
      broadcastData(msg);
    }
    renderBingeUI();
  }
}

// Robust public WebRTC tracker list
const WEBTORRENT_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.fastcast.nz',
  'wss://tracker.webtorrent.io',
  'wss://signal.torrentcdn.com'
];

// Helper to seed file with WebTorrent and broadcast magnet
function seedBingeFileWithWebTorrent(file) {
  console.log('[BINGE][DEBUG][HOST] Attempting to seed file:', file);
  if (!WebTorrent) { // WebTorrent should be defined here due to loadWebTorrentIfNeeded
    console.error('[BINGE][DEBUG][HOST] WebTorrent is not loaded!');
    showModal('Error', 'WebTorrent failed to load. Please try again.');
    return;
  }
  if (!file || !file.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)$/i)) {
    console.error('[BINGE][DEBUG][HOST] File is not a supported video or music:', file);
    showModal('Unsupported File Type', 'Only .mp4, .webm, .ogg, .mkv, .mp3, .flac, .wav, .m4a, .aac files are supported.');
    return;
  }
  if (_bingeWebTorrent) { _bingeWebTorrent.destroy(); _bingeWebTorrent = null; }
  console.log('[BINGE] Seeding file:', file);
  const client = new WebTorrent({ announce: WEBTORRENT_TRACKERS });
  _bingeWebTorrent = client;
  console.log('[BINGE] Created WebTorrent client:', client);
  client.seed(file, { announce: WEBTORRENT_TRACKERS }, torrent => {
    const magnetURI = torrent.magnetURI;
    console.log('[BINGE] File seeded. Magnet URI:', magnetURI);
    bingeSource = { type: 'torrent', value: magnetURI };
    // Only now, after seeding is ready, broadcast as a torrent Binge session
    broadcastData({ type: 'binge-start', hostId: myPeerId, source: { type: 'torrent', value: magnetURI }, sessionId: bingeSessionId });
    // Broadcast chat message
    const hostName = myUsername || peerUsernames[myPeerId] || 'Host';
    const msg = {
      type: 'chat',
      text: `👤 ${hostName} started a Binge session. Click 🍿 to join.`,
      username: 'System',
      timestamp: getCurrentTimeStr(),
      msgId: `${myPeerId}-binge-${Date.now()}`,
      meshFrom: myPeerId,
      senderId: myPeerId,
      chatMode: 'normal'
    };
    if (!knownMsgIds.has(msg.msgId)) {
      normalChatHistory.push({ senderId: myPeerId, text: msg.text, username: msg.username, timestamp: msg.timestamp, color: '#f4c542', msgId: msg.msgId });
      knownMsgIds.add(msg.msgId);
      broadcastData(msg);
    }
    renderBingeUI();
    // After host seeds the file, start logging numPeers
    startHostPeerDebug();
    // --- Host: Play from original file ---
    setTimeout(() => {
      try {
        const area = document.getElementById('bingePlayerArea');
        if (!area) {
          console.error('[BINGE][DEBUG][HOST] bingePlayerArea not found');
          return;
        }
        let video = document.getElementById('bingeVideo');
        if (!video) {
          video = document.createElement('video');
          video.id = 'bingeVideo';
          video.autoplay = false;
          video.controls = true;
          video.preload = 'metadata';
          video.style.width = '100%';
          video.style.maxWidth = '100%';
          video.style.borderRadius = 'var(--radius)';
          video.style.background = '#000';
          video.style.outline = 'none';
          area.innerHTML = '';
          area.appendChild(video);
        }
        const blobUrl = URL.createObjectURL(file);
        video.src = blobUrl;
        video.autoplay = false;
        video.pause();
        console.log('[BINGE][DEBUG][HOST] Host setting video src from file:', blobUrl, video, file);
        setupHostBingeVideoEvents(video);
        // No autoplay, no video.play() here
        if (typeof tryStartBroadcastOnHostPlay === 'function') {
          tryStartBroadcastOnHostPlay();
        }
        // Do NOT start broadcast until the host actually presses Play (handled by tryStartBroadcastOnHostPlay)
      } catch (err) {
        console.error('[BINGE][DEBUG][HOST] Error setting up video element:', err);
        showModal('Video Setup Error', 'Failed to set up video playback. See console for details.');
      }
    }, 500);
  });
}

// Handle incoming Binge events
function handleBingeData(data, fromPid) {
  if (data.type === 'binge-sync') {
    if (bingeHostId !== data.hostId) return;
    if (bingeHostId !== myPeerId) {
      applyBingeSyncToPeer(data);
    }
    return;
  }
  if (data.type === 'binge-start') {
    if (!bingeActive) {
      bingeActive = true;
      bingeHostId = data.hostId;
      bingeSource = data.source;
      bingeSessionId = data.sessionId;
      bingeReadyPeers = new Set([data.hostId]);
      bingeViewers = new Set();
    }
    // Always re-render Binge UI so peer sets up video/torrent player
    if (isBingeScreenVisible()) { // Only render if binge section is visible
      renderBingeUI();
    }
    return;
  } else if (data.type === 'binge-join') {
    if (bingeHostId === myPeerId) {
      // Send chat message to all peers that a new peer joined
      const joinerName = peerUsernames[fromPid] || fromPid || 'A peer';
      const msgId = `${fromPid}-binge-join`;
      const msg = {
        type: 'chat',
        text: `👤 ${joinerName} joined the Binge session.`,
        username: 'System',
        timestamp: getCurrentTimeStr(),
        msgId,
        meshFrom: myPeerId,
        senderId: myPeerId, // Host is the sender
        chatMode: 'binge',
        color: '#f4c542'
      };
      if (!knownMsgIds.has(msgId)) {
        bingeChatHistory.push(msg);
        knownMsgIds.add(msgId);
        broadcastData(msg); // This will reach all peers
        addChatMessage(msg); // always show immediately
      }
      sendBingeStateToPeer(fromPid);
    }
  } else if (data.type === 'binge-ready') {
    bingeReadyPeers.add(fromPid);
    // If host, auto-sync
    if (bingeHostId === myPeerId) {
      // The existing logic already sends sync state, just ensure it uses sendBingeStateToPeer
      sendBingeStateToPeer(fromPid); // ENSURED THIS IS USED
      console.log(`[BINGE][HOST] Received binge-ready from ${fromPid}, sending current state.`);
      // If this is the first time we see this peer ready, send join chat message
      const msgId = `${fromPid}-binge-join`;
      if (!knownMsgIds.has(msgId)) {
        const joinerName = peerUsernames[fromPid] || fromPid || 'A peer';
        const msg = {
          type: 'chat',
          text: `👤 ${joinerName} joined the Binge session.`,
          username: 'System',
          timestamp: getCurrentTimeStr(),
          msgId,
          meshFrom: myPeerId,
          senderId: myPeerId,
          chatMode: 'binge',
          color: '#f4c542'
        };
        knownMsgIds.add(msgId);
        bingeChatHistory.push(msg);
        broadcastData(msg);
        addChatMessage(msg); // always show immediately
      }
    }
  } else if (data.type === 'binge-stop') {
    const area = document.getElementById('bingeBannerArea');
    if (area) {
      area.innerHTML = `<div class="binge-banner">Binge session ended by host.</div>`;
    }
    bingeActive = false;
    bingeHostId = null;
    bingeSource = null;
    bingeSessionId = null;
    bingeReadyPeers = new Set();
    bingeViewers = new Set();
    bingeFileObj = null;
    // Clear Binge chat history when session ends
    bingeChatHistory = [];
    renderChatHistory(); // Always update chat UI after clearing
    // Always re-render Binge UI if visible
    if (isBingeScreenVisible()) renderBingeUI();
    
    // Ensure proper cleanup by calling hideBingeView
    // This will handle all media resource cleanup
    cleanupAllMediaResources(); // Call new comprehensive cleanup function
    
    // Additional cleanup specific to binge-stop
    if (bingeTorrent && typeof bingeTorrent.destroy === 'function') {
      try {
        console.log('[BINGE] Cleaning up WebTorrent client on session stop');
        bingeTorrent.destroy(() => {
          console.log('[BINGE] WebTorrent client destroyed on session stop');
          bingeTorrent = null;
        });
      } catch (e) {
        console.warn('[BINGE] Error destroying WebTorrent client on session stop:', e);
        bingeTorrent = null;
      }
    }
    return;
  }
  // --- ADDED: Host responds to binge-join with session info ---
  if (data.type === 'binge-join') {
    if (bingeHostId === myPeerId && bingeActive && bingeSource && bingeSessionId) {
      // Send session info to the joining peer only
      if (mesh[fromPid] && mesh[fromPid].conn && mesh[fromPid].conn.open) {
        mesh[fromPid].conn.send({
          type: 'binge-session-info',
          bingeActive,
          bingeHostId,
          bingeSource: { ...bingeSource }, // Send a copy to avoid mutation issues
          bingeSessionId
        });
      }
    }
    return;
  }
}

// Broadcast Binge sync event
function broadcastBingeSync(action, value) {
  let currentTime = 0;
  let paused = true;
  let playbackRate = 1;

  if (bingeSource.type === 'youtube' && ytPlayer && ytPlayerReady) {
    currentTime = ytPlayer.getCurrentTime();
    paused = ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING;
    playbackRate = ytPlayer.getPlaybackRate();
  } else {
    const video = document.getElementById('bingeVideo');
    if (!video) return;
    currentTime = video.currentTime;
    paused = video.paused;
    playbackRate = video.playbackRate;
  }

  const msg = {
    type: 'binge-sync',
    hostId: myPeerId,
    currentTime,
    paused,
    playbackRate,
    action,
    value,
    sourceType: bingeSource.type
  };
  broadcastData(msg);
}
function sendBingeSyncToPeer(pid, currentTime, paused) {
  const msg = {
    type: 'binge-sync',
    hostId: myPeerId,
    currentTime,
    paused,
    sourceType: bingeSource.type
  };
  if (mesh[pid] && mesh[pid].conn && mesh[pid].conn.open) {
    mesh[pid].conn.send(msg);
  }
}

// Setup WebTorrent player
function setupTorrentPlayer() {
  // Prevent duplicate initialization
  if (_bingeTorrentPlayerInit) {
    // If video already exists, just return
    if (document.getElementById('bingeVideo')) {
      console.log('[BINGE][DEBUG] Torrent player already initialized');
      return;
    }
  }
  _bingeTorrentPlayerInit = true;
  const area = document.getElementById('bingePlayerArea'); // Changed from bingeTorrentPlayer
  if (!area || !bingeSource || bingeSource.type !== 'torrent') return;
  console.log('[BINGE][DEBUG] setupTorrentPlayer called, bingeSource:', bingeSource);
  
  // Dynamically load WebTorrent if not loaded
  // This block is now mostly redundant as loadWebTorrentIfNeeded is used earlier
  if (!WebTorrent) {
    console.error('[BINGE][DEBUG] WebTorrent is not loaded, but should be by now!');
    return; // Should not happen if loadWebTorrentIfNeeded is awaited correctly
  }
  
  if (bingeTorrent) { bingeTorrent.destroy(); bingeTorrent = null; }
  bingeTorrent = new WebTorrent(getWebTorrentConfig(true));
  
  area.innerHTML = '<div style="color:#888;padding:1em;">Loading torrent...</div>';
  // --- Add error timeout ---
  let errorTimeout = setTimeout(() => {
    area.innerHTML = '<div style="color:#b14a4a;padding:1em;">Could not connect to the host to download the video. Check your network or try again.</div>';
  }, 30000); // 30 seconds
  
  bingeTorrent.add(bingeSource.value, getWebTorrentConfig(), torrent => {
    clearTimeout(errorTimeout);
    const file = torrent.files.find(f => f.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)$/i));
    if (!file) {
      area.innerHTML = '<div style="color:#b14a4a;padding:1em;">No playable video or music file found in torrent.</div>';
      console.warn('[BINGE][DEBUG] No playable video or music file found in torrent:', torrent.files.map(f => f.name));
      return;
    }
    console.log('[BINGE][DEBUG] Found video or music file in torrent:', file);
    
    // Create a video element and append it to the area
    const videoElem = document.createElement('video');
    videoElem.id = 'bingeVideo';
    videoElem.autoplay = false;
    videoElem.preload = 'metadata';
    videoElem.style.width = '100%';
    videoElem.style.maxWidth = '100%';
    videoElem.style.borderRadius = 'var(--radius)';
    videoElem.style.background = '#000';
    videoElem.style.outline = 'none';
    area.innerHTML = ''; // Clear loading message
    area.appendChild(videoElem);

    file.renderTo(videoElem, { autoplay: false }, (err, elem) => {
      if (err) {
        area.innerHTML = '<div style="color:#b14a4a;padding:1em;">Failed to load video or music.</div>';
        console.error('[BINGE][DEBUG] Error appending video or music:', err);
        return;
      }
      elem.id = 'bingeVideo'; // Ensure the ID is set
      elem.autoplay = false; // disable default autoplay
      elem.preload = 'metadata';
      console.log('[BINGE][DEBUG] Video or music element created from torrent:', elem);
      // --- Only host gets controls, peers get fullscreen only ---
      if (bingeHostId === myPeerId) {
        elem.setAttribute('controls', '');
        setupHostBingeVideoEvents(elem);
      } else {
        elem.removeAttribute('controls');
        elem.tabIndex = -1;
        elem.style.pointerEvents = 'none';
        elem.addEventListener('contextmenu', e => e.preventDefault());
        elem.addEventListener('keydown', e => e.preventDefault());
        elem.addEventListener('mousedown', e => e.preventDefault());
        elem.addEventListener('touchstart', e => e.preventDefault());
        // Add fullscreen button for viewers
        if (!document.getElementById('bingeFullscreenBtn')) {
          let fullscreenBtn = document.createElement('button');
          fullscreenBtn.id = 'bingeFullscreenBtn';
          fullscreenBtn.title = 'Fullscreen';
          fullscreenBtn.style = 'position:absolute;top:12px;right:12px;z-index:10;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
          fullscreenBtn.innerHTML = '<span style="font-size:1.7em;">⛶</span>';
          area.parentElement.style.position = 'relative';
          area.parentElement.appendChild(fullscreenBtn);
          fullscreenBtn.addEventListener('click', () => {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
            else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
            else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
          });
        }
        setupViewerBingeVideoEvents(elem);
      }
      // Try to play immediately
      const tryPlay = () => {
        elem.play().then(() => {
          console.log('[BINGE][DEBUG][PEER] video.play() succeeded (realtime)');
        }).catch(err => {
          // Suppress non-fatal errors (e.g., paused to save power, autoplay blocked)
          if (err && err.name === 'AbortError') {
            console.warn('[BINGE][DEBUG][PEER] video.play() non-fatal:', err.message);
          } else {
            console.warn('[BINGE][DEBUG][PEER] video.play() failed (realtime):', err);
          }
          // Show Click to Play button if autoplay fails
          if (!document.getElementById('bingePlayBtn')) {
            const btn = document.createElement('button');
            btn.id = 'bingePlayBtn';
            btn.textContent = 'Click to Play';
            btn.style = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;font-size:1.2em;padding:1em 2em;';
            btn.onclick = () => {
              elem.play().then(() => btn.remove());
            };
            area.appendChild(btn);
          }
        });
      };
      tryPlay();
      elem.addEventListener('canplay', tryPlay);
      // Remove any waiting banners
      const banners = area.parentElement.querySelectorAll('.binge-banner');
      banners.forEach(b => b.remove());
      // After peer creates video element from torrent, start logging numPeers
      startPeerPeerDebug();
      // Do NOT destroy the torrent or video element until the session ends
    });
  });
}

// Attach Binge button event listener at the very end, after all functions are defined
document.addEventListener('DOMContentLoaded', () => {
  const bingeBtn = document.getElementById('bingeBtn');
  console.log('Binge button found:', !!bingeBtn);
  if (bingeBtn) {
    bingeBtn.addEventListener('click', () => {
      if (isBingeScreenVisible()) { // Check if binge screen is currently visible
        hideBingeView(); // If visible, hide it and clean up
      } else {
        showBingeView(); // Otherwise, show it
      }
    });
  }
});

// PeerJS: Patch onDataReceived for Binge
const origOnDataReceivedBinge = onDataReceived;
onDataReceived = function(data, fromPid, conn) {
  if (data && data.type && data.type.startsWith('binge-')) {
    if (data.type === 'binge-session-info') {
      // First clean up any existing session before applying new info
      cleanupAllMediaResources();
      bingeActive = data.bingeActive;
      bingeHostId = data.bingeHostId;
      bingeSource = data.bingeSource;
      bingeSessionId = data.sessionId;
      // Always re-render Binge UI if visible
      if (isBingeScreenVisible()) renderBingeUI();
      return;
    }
    handleBingeData(data, fromPid);
    return;
  }
  origOnDataReceivedBinge(data, fromPid, conn);
};

// Join Binge banner for viewers
function maybeShowJoinBingeBanner() {
  if (!bingeActive || bingeHostId === myPeerId) return;
  const area = document.getElementById('bingeBannerArea');
  if (!area) return;
  area.innerHTML = `<div class="binge-banner">A Binge session is active.</div>`;
  // Removed the "Sync Now" button
}

// On Binge UI render, show join banner if needed
const origRenderBingeUI = renderBingeUI;
renderBingeUI = function() {
  origRenderBingeUI();
  maybeShowJoinBingeBanner();
};

// Sync Now button for viewers - REMOVED
// function showSyncNowBtn() {
//   if (!bingeActive || bingeHostId === myPeerId) return;
//   const area = document.getElementById('bingeBannerArea');
//   if (!area) return;
//   area.innerHTML += `<button class="binge-sync-btn" id="syncNowBtn">Sync Now</button>`;
//   const btn = document.getElementById('syncNowBtn');
//   if (btn) {
//     btn.onclick = () => {
//       // Request sync from host
//       broadcastData({ type: 'binge-join', hostId: bingeHostId, peerId: myPeerId });
//     };
//   }
// }

// New function for comprehensive media cleanup
function cleanupAllMediaResources() {
  console.log('[BINGE] Starting comprehensive media cleanup');
  
  // Clean up video element
  const video = document.getElementById('bingeVideo');
  if (video) {
    console.log('[BINGE] Cleaning up video element');
    // Stop all tracks in srcObject if it exists
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => {
        console.log('[BINGE] Stopping track:', track);
        track.stop();
      });
      video.srcObject = null; // Explicitly nullify srcObject
    }
    video.pause();
    video.removeAttribute('src');
    video.load();
    
    // Clear all event listeners (clone node is a common way to do this)
    const newVideo = video.cloneNode(false);
    video.parentNode.replaceChild(newVideo, video);
  }

  // Clean up iframe
  const iframe = document.getElementById('bingeIframe');
  if (iframe) {
    console.log('[BINGE] Cleaning up iframe');
    iframe.src = '';
    // Optionally remove iframe if it's not needed for future sessions
    // iframe.remove(); // This might remove the element from the DOM entirely
  }

  // Clean up YouTube player
  if (ytPlayer) {
    console.log('[BINGE] Cleaning up YouTube player');
    try { 
      ytPlayer.stopVideo();
      ytPlayer.destroy(); // Destroy the player instance
    } catch (e) { 
      console.warn('[BINGE] Error cleaning up YouTube player:', e); 
    }
    ytPlayer = null;
    ytPlayerReady = false;
  }

  // Clean up WebTorrent client (for both host and peer)
  if (bingeTorrent && typeof bingeTorrent.destroy === 'function') {
    console.log('[BINGE] Cleaning up WebTorrent client (peer)');
    try {
      bingeTorrent.destroy(() => {
        console.log('[BINGE] WebTorrent client (peer) destroyed');
        bingeTorrent = null;
      });
    } catch (e) {
      console.warn('[BINGE] Error destroying WebTorrent client (peer):', e);
      bingeTorrent = null;
    }
  }
  if (_bingeWebTorrent && typeof _bingeWebTorrent.destroy === 'function') {
    console.log('[BINGE] Cleaning up WebTorrent client (host)');
    try {
      _bingeWebTorrent.destroy(() => {
        console.log('[BINGE] WebTorrent client (host) destroyed');
        _bingeWebTorrent = null;
      });
    } catch (e) {
      console.warn('[BINGE] Error destroying WebTorrent client (host):', e);
      _bingeWebTorrent = null;
    }
  }

  // Clean up PeerJS media calls
  if (typeof peerMediaCalls !== 'undefined') {
    console.log('[BINGE] Cleaning up PeerJS media calls');
    Object.values(peerMediaCalls).forEach(call => {
      try {
        if (call && typeof call.close === 'function') {
          call.close();
        }
      } catch (e) {
        console.warn('[BINGE] Error closing media call:', e);
      }
    });
    peerMediaCalls = {};
  }

  // Clean up broadcast stream (host side)
  if (broadcastStream) {
    console.log('[BINGE] Cleaning up broadcast stream');
    try {
      broadcastStream.getTracks().forEach(track => {
        console.log('[BINGE] Stopping broadcast stream track:', track);
        track.stop();
      });
      broadcastStream = null;
    } catch (e) {
      console.warn('[BINGE] Error cleaning up broadcast stream:', e);
    }
  }
  console.log('[BINGE] Comprehensive media cleanup complete');
}


function hideBingeView() {
  // Clean up all media resources first
  cleanupAllMediaResources();
  
  // Hide the binge section
  bingeSection.classList.add('hidden');
  
  // Move chat elements back to main chat section if needed
  const chatSectionEl = document.getElementById('chatSection');
  if (chatSectionEl) {
    if (chatArea && chatArea.parentElement !== chatSectionEl) {
      chatSectionEl.appendChild(chatArea);
    }
    if (chatForm && chatForm.parentElement !== chatSectionEl) {
      chatSectionEl.appendChild(chatForm);
    }
    chatSectionEl.classList.remove('hidden');
  }
  
  // Switch back to normal chat
  switchToNormalChat();
  renderChatHistory();
  show(stackToggleBtn); // Show stackToggleBtn when exiting binge view
}

// Update endBingeSessionByHost to always clear bingeSource and re-render UI
function endBingeSessionByHost(stayInBingeView) {
  if (!bingeActive || bingeHostId !== myPeerId) return;
  broadcastData({ type: 'binge-stop', hostId: myPeerId });
  // Broadcast chat message
  const msg = {
    type: 'chat',
    text: `Binge session ended by host.`,
    username: 'System',
    timestamp: getCurrentTimeStr(),
    msgId: `${myPeerId}-binge-end-${Date.now()}`,
    meshFrom: myPeerId,
    chatMode: 'normal'
  };
  if (!knownMsgIds.has(msg.msgId)) {
    normalChatHistory.push({ senderId: myPeerId, text: msg.text, username: msg.username, timestamp: msg.timestamp, color: '#b14a4a', msgId: msg.msgId });
    knownMsgIds.add(msg.msgId);
    broadcastData(msg);
  }
  bingeActive = false;
  bingeHostId = null;
  bingeSource = null;
  bingeSessionId = null;
  bingeReadyPeers = new Set();
  bingeViewers = new Set();
  bingeFileObj = null;
  // Clear Binge chat history for host and update UI
  bingeChatHistory = [];
  renderChatHistory();
  if (stayInBingeView) {
    renderBingeUI(); // Show source selection again, no video
  } else {
    renderBingeUI();
    hideBingeView();
  }
}

// On page load, always check bingeActive and show Binge view if needed
document.addEventListener('DOMContentLoaded', () => {
  lastPeersVisible = false;
  // Initial state: if no joinPeerId, show startBtn centered
  if (!joinPeerId) {
    show(startSessionContainer);
    mainElement.classList.add('center-start-session');
    hide(stackToggleBtn); // Ensure stackToggleBtn is hidden initially
  } else {
    // If joining a session, hide startBtn and hide stackToggleBtn initially
    hide(startSessionContainer);
    mainElement.classList.remove('center-start-session');
    hide(stackToggleBtn); // Hide stackToggleBtn initially when joining
  }
  expandStack(); // Always expand on landing
  autoStackCollapseOnPeers(); // This will handle hiding stackToggleBtn if no peers
  renderChatHistory();
  if (bingeActive) showBingeView();
});

// After host seeds the file, start logging numPeers
function startHostPeerDebug() {
  if (_bingeWebTorrent && _bingeWebTorrent.torrents && _bingeWebTorrent.torrents[0]) {
    setInterval(() => {
      const n = _bingeWebTorrent.torrents[0]?.numPeers;
      console.log('[BINGE][DEBUG][HOST] WebTorrent numPeers:', n);
    }, 2000);
  }
}
// After peer creates video element from torrent, start logging numPeers
function startPeerPeerDebug() {
  if (bingeTorrent && bingeTorrent.torrents && bingeTorrent.torrents[0]) {
    setInterval(() => {
      const n = bingeTorrent.torrents[0]?.numPeers;
      console.log('[BINGE][DEBUG][PEER] WebTorrent numPeers:', n);
    }, 2000);
  }
}

// --- Peer sync: always apply latest host sync as soon as video is ready ---
let pendingBingeSync = null;
function applyBingeSyncToPeer(sync) {
  const video = document.getElementById('bingeVideo');
  const iframe = document.getElementById('bingeIframe');

  if (sync.sourceType === 'youtube' && ytPlayer && ytPlayerReady) {
    if (ytSyncLock) return;
    ytSyncLock = true;
    // Only seek if difference is significant
    if (Math.abs(ytPlayer.getCurrentTime() - sync.currentTime) > 0.5) {
      ytPlayer.seekTo(sync.currentTime, true);
      console.log('[BINGE][DEBUG][PEER][YOUTUBE] Set currentTime to', sync.currentTime);
    }
    if (ytPlayer.getPlaybackRate() !== sync.playbackRate) {
      ytPlayer.setPlaybackRate(sync.playbackRate);
      console.log('[BINGE][DEBUG][PEER][YOUTUBE] Set playbackRate to', sync.playbackRate);
    }
    if (sync.paused && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
      ytPlayer.pauseVideo();
      console.log('[BINGE][DEBUG][PEER][YOUTUBE] Paused video');
    } else if (!sync.paused && ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
      ytPlayer.playVideo();
      console.log('[BINGE][DEBUG][PEER][YOUTUBE] Played video');
    }
    setTimeout(() => { ytSyncLock = false; }, 200); // Release lock after a short delay
    return;
  } else if (sync.sourceType === 'spotify' || sync.sourceType === 'googledrive') {
    // Spotify and Google Drive embeds cannot be controlled via JS API for playback sync.
    // Peers will just see whatever the host's player is doing.
    return;
  }

  // For video/file/torrent
  if (!video) {
    console.warn('[BINGE][DEBUG][PEER] No video element to apply sync');
    return;
  }
  // Show loading indicator if not ready
  if (video.readyState < 3) { // HAVE_FUTURE_DATA
    let loadingMsg = document.getElementById('bingePeerLoadingMsg');
    if (!loadingMsg && video.parentElement) {
      loadingMsg = document.createElement('div');
      loadingMsg.id = 'bingePeerLoadingMsg';
      loadingMsg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;';
      loadingMsg.textContent = 'Loading video...';
      video.parentElement.appendChild(loadingMsg);
    }
    console.log('[BINGE][DEBUG][PEER] Video not ready (readyState < 3), queueing sync');
    pendingBingeSync = sync;
    // Attach one-time handler
    const onReady = () => {
      if (pendingBingeSync) {
        console.log('[BINGE][DEBUG][PEER] Video ready, applying queued sync');
        actuallyApplyBingeSyncToPeer(pendingBingeSync);
        pendingBingeSync = null;
      }
      video.removeEventListener('canplaythrough', onReady); // Use canplaythrough for more data
      if (video._syncPollInterval) { clearInterval(video._syncPollInterval); video._syncPollInterval = null; }
    };
    video.addEventListener('canplaythrough', onReady); // Use canplaythrough for more data
    // Fallback: poll readyState every 500 ms in case events never fire
    if (!video._syncPollInterval) {
      video._syncPollInterval = setInterval(() => {
        if (video.readyState >= 3 && pendingBingeSync) { // Check for HAVE_FUTURE_DATA
          console.log('[BINGE][DEBUG][PEER] Poll detected video ready, applying queued sync');
          actuallyApplyBingeSyncToPeer(pendingBingeSync);
          pendingBingeSync = null;
          clearInterval(video._syncPollInterval);
          video._syncPollInterval = null;
        }
      }, 500);
    }
    return;
  }
  actuallyApplyBingeSyncToPeer(sync);
}

function actuallyApplyBingeSyncToPeer(sync) {
  const video = document.getElementById('bingeVideo');
  if (!video) return;

  // Clear any existing loading message if it's still there
  const loadingMsg = document.getElementById('bingePeerLoadingMsg');
  if (loadingMsg) loadingMsg.remove();

  // Always seek to host's current time if difference > 0.5s (increased tolerance slightly)
  if (Math.abs(video.currentTime - sync.currentTime) > 0.5) {
    video.currentTime = sync.currentTime;
    console.log('[BINGE][DEBUG][PEER] Set currentTime to', sync.currentTime);
  }
  // Always set playback rate
  if (video.playbackRate !== sync.playbackRate) {
    video.playbackRate = sync.playbackRate;
    console.log('[BINGE][DEBUG][PEER] Set playbackRate to', sync.playbackRate);
  }
  // Pause or play video and control WebTorrent downloading
  if (sync.paused && !video.paused) {
    video.pause();
    updatePeerTorrentDownloading(true); // Pause WebTorrent downloading
    console.log('[BINGE][DEBUG][PEER] Paused video and torrent');
  } else if (!sync.paused && video.paused) {
    updatePeerTorrentDownloading(false); // Resume WebTorrent downloading
    // Try to play, and keep retrying if not ready
    const tryPlay = () => {
      // Only attempt play if video has enough data (HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA)
      if (video.readyState >= 3) {
        video.play().then(() => {
          video.muted = false; // Ensure it's unmuted after user gesture/autoplay
          video.volume = 1.0;
          console.log('[BINGE][DEBUG][PEER] Played video and resumed torrent');
        }).catch(err => {
          console.warn('[BINGE][DEBUG][PEER] video.play() failed:', err);
          // If autoplay is blocked, add a "Click to Play" button
          if (err.name === 'NotAllowedError' && !document.getElementById('bingePlayBtn')) {
            const area = document.getElementById('bingePlayerArea');
            if (area) {
              const btn = document.createElement('button');
              btn.id = 'bingePlayBtn';
              btn.textContent = 'Click to Play';
              btn.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;font-size:1.2em;padding:1em 2em;';
              btn.onclick = () => {
                video.play().then(() => btn.remove());
              };
              area.appendChild(btn);
            }
          }
        });
      } else {
        console.log('[BINGE][DEBUG][PEER] Video not ready for play, retrying...');
        setTimeout(tryPlay, 500); // Retry until ready
      }
    };
    tryPlay();
  }
}

// --- Restore missing event setup functions ---
function setupHostBingeVideoEvents(video) {
  if (!video) return;
  video.onplay = () => { broadcastBingeState(); updateHostTorrentSeeding(false); };
  video.onpause = () => { broadcastBingeState(); updateHostTorrentSeeding(true); };
  video.onseeked = () => broadcastBingeState();
  video.onratechange = () => broadcastBingeState();
  video.removeAttribute('tabindex');
  video.style.pointerEvents = '';
  const removeLoading = () => {
    const loadingMsg = document.getElementById('bingeHostLoadingMsg');
    if (loadingMsg) loadingMsg.remove();
  };
  video.addEventListener('canplay', removeLoading);
  video.addEventListener('canplaythrough', removeLoading);
  
  // Add ambient background effect
  setupAmbientBackgroundEffect(video);
}

function setupViewerBingeVideoEvents(video) {
  if (!video) return;
  video.onplay = null;
  video.onpause = null;
  video.onseeked = null;
  video.onratechange = null;
  video.removeAttribute('controls');
  video.tabIndex = -1;
  video.style.pointerEvents = 'none';
  
  // Add ambient background effect
  setupAmbientBackgroundEffect(video);
}

// --- Host-driven video broadcast using PeerJS media streams ---
let broadcastStream = null;
let peerMediaCalls = {};

function startHostBroadcastStream() {
  const hostVideoElem = document.getElementById('bingeVideo');
  if (!hostVideoElem || !hostVideoElem.captureStream) {
    console.warn('[BROADCAST] Host video element missing or captureStream not supported.');
    return;
  }
  broadcastStream = hostVideoElem.captureStream();
  console.log('[BROADCAST] Host started captureStream:', broadcastStream);
  Object.entries(mesh).forEach(([pid, ent]) => {
    if (pid === myPeerId) return;
    if (ent.conn && ent.conn.open && !peerMediaCalls[pid]) {
      const mediaCall = peer.call(pid, broadcastStream);
      peerMediaCalls[pid] = mediaCall;
      mediaCall.on('close', () => { delete peerMediaCalls[pid]; });
      mediaCall.on('error', err => { console.warn('[BROADCAST] Media call error:', err); });
      console.log('[BROADCAST] Called peer with video stream:', pid);
    }
  });
}

function callNewPeerWithBroadcastStream(pid) {
  if (broadcastStream && peer && mesh[pid] && mesh[pid].conn && mesh[pid].conn.open && !peerMediaCalls[pid]) {
    const mediaCall = peer.call(pid, broadcastStream);
    peerMediaCalls[pid] = mediaCall;
    mediaCall.on('close', () => { delete peerMediaCalls[pid]; });
    mediaCall.on('error', err => { console.warn('[BROADCAST] Media call error:', err); });
    console.log('[BROADCAST] Called new peer with video stream:', pid);
  }
}

// Patch setupConnHandlers to call new peer with broadcast stream
const origSetupConnHandlers2 = setupConnHandlers;
setupConnHandlers = function(conn, pid, isIncoming) {
  origSetupConnHandlers2(conn, pid, isIncoming);
  // Media stream logic (new variable names)
  if (isHost && broadcastStream) {
    callNewPeerWithBroadcastStream(pid);
  }
};

// When the host starts playing the video, start broadcasting (new variable names)
function tryStartBroadcastOnHostPlay() {
  const hostVideoElem = document.getElementById('bingeVideo');
  if (!hostVideoElem) return;
  hostVideoElem.addEventListener('play', () => {
    if (isHost && !broadcastStream) {
      startHostBroadcastStream();
    }
  }, { once: true });
}

// Patch renderBingePlayer to start broadcast on host play (new variable names)
const originalRenderBingePlayer = renderBingePlayer; // Store original
renderBingePlayer = function() { // Re-assign
  originalRenderBingePlayer(); // Call original
  if (isHost && (bingeSource.type === 'url' || bingeSource.type === 'video')) {
    tryStartBroadcastOnHostPlay();
  }
};

// --- Robust magnet binge logic (new variable names) ---
function startMagnetBinge(magnetLink) {
  const magnetClient = new WebTorrent({ announce: WEBTORRENT_TRACKERS });
  console.log('[MAGNET][HOST] Seeding magnet:', magnetLink);
  magnetClient.add(magnetLink, { announce: WEBTORRENT_TRACKERS }, torrent => {
    const magnetFile = torrent.files.find(f => f.name.match(/\.(mp4|webm|ogg|mkv|mp3|flac|wav|m4a|aac)$/i));
    if (!magnetFile) {
      console.error('[MAGNET][HOST] No playable video or music file found in torrent.');
      return;
    }
    magnetFile.getBlobURL((err, url) => {
      if (err) {
        console.error('[MAGNET][HOST] Error getting Blob URL:', err);
        return;
      }
      const hostVideoElem = document.getElementById('bingeVideo');
      if (hostVideoElem) {
        hostVideoElem.src = url;
        hostVideoElem.autoplay = false;
        hostVideoElem.pause();
        console.log('[MAGNET][HOST] Host video src set to Blob URL from magnet:', url);
      }
    });
  });
}

// Helper: show overlay button to unmute on user gesture
function addUnmuteOverlay(video, parent) {
  if (!video || !parent) return;
  // If already unmuted or overlay exists, skip
  if (!video.muted || parent.querySelector('#bingeUnmuteBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'bingeUnmuteBtn';
  btn.textContent = 'Tap to Unmute';
  btn.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);padding:0.6em 1.2em;font-size:1em;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:4px;cursor:pointer;z-index:9999;';
  parent.style.position = 'relative';
  parent.appendChild(btn);
  const remove = () => { btn.remove(); video.removeEventListener('volumechange', onVol); };
  const onVol = () => { if (!video.muted) remove(); };
  video.addEventListener('volumechange', onVol);
  btn.addEventListener('click', () => {
    video.muted = false;
    video.volume = 1.0;
    remove();
  });
}

// --- Show broadcast quality warning to all peers in binge session ---
function showBroadcastQualityWarning() {
  const area = document.getElementById('bingePlayerArea');
  if (area && !document.getElementById('bingeBroadcastWarning')) {
    const warn = document.createElement('div');
    warn.id = 'bingeBroadcastWarning';
    warn.style.cssText = 'color:#b14a4a;padding:0.5em;text-align:center;font-size:0.95em;';
    let text = '';
    if (bingeHostId === myPeerId) {
      text = 'You are broadcasting a live stream. Peers may experience lower audio/video quality.';
    } else {
      text = 'You have joined a broadcasting live stream. You may experience lower audio/video quality.';
    }
    warn.textContent = text;
    area.appendChild(warn);
  }
}

// Patch renderBingePlayer to show warning to all peers in broadcast mode
const originalRenderBingePlayer2 = renderBingePlayer; // Store original
renderBingePlayer = function() { // Re-assign
  originalRenderBingePlayer2(); // Call original
  if (bingeSource && (bingeSource.type === 'url' || bingeSource.type === 'video')) {
    showBroadcastQualityWarning();
  }
};

// Add debug logging for local testing
function debugMagnetStream(role, event, data) {
  const prefix = role === 'host' ? '[MAGNET][HOST]' : '[MAGNET][PEER]';
  console.log(`${prefix} ${event}`, data);
}

// Helper to check if binge screen is visible
function isBingeScreenVisible() {
  const bingeSection = document.getElementById('bingeSection');
  return bingeSection && !bingeSection.classList.contains('hidden');
}

// Place ambient background behind everything in binge-root
function ensureAmbientBackground() {
  const bingeRoot = document.querySelector('.binge-root');
  if (!bingeRoot) return;
  if (!bingeRoot.querySelector('.binge-ambient-bg')) {
    const ambientBg = document.createElement('div');
    ambientBg.className = 'binge-ambient-bg';
    bingeRoot.insertBefore(ambientBg, bingeRoot.firstChild);
  }
}

function setupAmbientBackgroundEffect(element) {
  console.log('[AMBIENT] Setting up ambient effect for:', element.tagName);
  const bingeRoot = document.querySelector('.binge-root'); // Use binge-root as the container
  if (!bingeRoot) {
    console.log('[AMBIENT] Could not find binge-root container');
    return;
  }

  // Ensure ambient background exists and get its reference
  ensureAmbientBackground();
  const ambientBg = bingeRoot.querySelector('.binge-ambient-bg'); 
  if (!ambientBg) {
    console.error('[AMBIENT] Failed to create or find ambient background.');
    return;
  }
  
  // Initial update attempt
  console.log('[AMBIENT] Performing initial color update');
  updateAmbientBackground(element, ambientBg);
  
  let updateInterval;
  
  const startUpdates = () => {
    console.log('[AMBIENT] Starting color updates');
    // Clear any existing interval
    if (updateInterval) clearInterval(updateInterval);
    // Update every 500ms while playing
    updateInterval = setInterval(() => {
      updateAmbientBackground(element, ambientBg);
    }, 500);
  };
  
  const stopUpdates = () => {
    console.log('[AMBIENT] Stopping color updates');
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };

  if (element.tagName === 'VIDEO') {
    // For video elements, use play/pause events
    element.addEventListener('play', () => {
      console.log('[AMBIENT] Video play event - starting color updates');
      startUpdates();
    });

    element.addEventListener('pause', () => {
      console.log('[AMBIENT] Video pause event - stopping color updates');
      stopUpdates();
    });

    element.addEventListener('loadeddata', () => {
      console.log('[AMBIENT] Video data loaded - attempting initial color update');
      updateAmbientBackground(element, ambientBg);
      if (!element.paused) startUpdates();
    });

    element.addEventListener('emptied', () => {
      console.log('[AMBIENT] Video unloaded - cleaning up');
      stopUpdates();
    });
  } else if (element.tagName === 'IFRAME') {
    // For iframes, start color animation immediately since we can't detect play state
    console.log('[AMBIENT] Iframe detected - starting ambient animation');
    startUpdates();
    
    // Clean up when iframe is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (!document.contains(element)) {
          console.log('[AMBIENT] Iframe removed - cleaning up');
          stopUpdates();
          observer.disconnect();
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function updateAmbientBackground(element, ambientBg) {
  let color;
  
  if (element.tagName === 'VIDEO' && !element.paused && element.videoWidth) {
    // For videos, try to extract color from current frame
    color = extractDominantColor(element);
  }
  
  if (!color) {
    // Fallback animation for iframes or when video color extraction fails
    console.log('[AMBIENT] Using fallback color animation');
    const time = (Date.now() / 1000) % 10 / 10; // 0 to 1 every 10 seconds
    color = {
      r: Math.round(217 + Math.sin(time * Math.PI * 2) * 20),
      g: Math.round(95 + Math.sin((time + 0.33) * Math.PI * 2) * 60),
      b: Math.round(38 + Math.sin((time + 0.66) * Math.PI * 2) * 20)
    };
  }
  
  const gradient = `radial-gradient(circle at center, 
    rgb(${color.r},${color.g},${color.b}) 0%,
    rgba(${color.r},${color.g},${color.b}, 1) 50%,
    rgba(${color.r},${color.g},${color.b}, 0) 100%)`;
    
  console.log('[AMBIENT] Updating background with gradient:', gradient);
  ambientBg.style.background = gradient;
}

function createVideoAmbientBackground(container) { // Changed parameter name to container
  console.log('[AMBIENT] Creating ambient background div in container:', container);
  const ambientBg = document.createElement('div');
  ambientBg.className = 'binge-ambient-bg';
  
  // Insert ambientBg as the first child of the container
  if (container && !container.querySelector('.binge-ambient-bg')) {
    container.insertBefore(ambientBg, container.firstChild);
  }
  return ambientBg;
}

function extractDominantColor(video) {
  try {
    if (!video || !video.videoWidth) {
      console.log('[AMBIENT] Video not ready for color extraction');
      return null;
    }

    // Create a canvas and get its context
    const canvas = document.createElement('canvas');
    canvas.width = 50;  // Reduced size for performance
    canvas.height = 50;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      console.log('[AMBIENT] Could not get canvas context');
      return null;
    }

    // Draw the current video frame
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Calculate average color
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let i = 0; i < pixels.length; i += 4) {
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count++;
      }

      const color = {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
      };

      console.log('[AMBIENT] Successfully extracted color:', color);
      return color;
    } catch (e) {
      console.log('[AMBIENT] Error drawing video to canvas:', e.message);
      if (e.name === 'SecurityError') {
        console.log('[AMBIENT] CORS issue detected - video must have crossOrigin="anonymous"');
      }
      return null;
    }
  } catch (e) {
    console.log('[AMBIENT] Error in color extraction:', e.message);
    return null;
  }
}

// --- Mobile Keyboard UX (Visual Viewport API) ---
// This function handles adjusting the main content padding when the mobile keyboard appears
function handleMobileKeyboard() {
  const mainElement = document.querySelector('main');
  if (!mainElement) return;

  // Check if it's a mobile device (based on screen width)
  const isMobile = window.matchMedia('(max-width: 700px)').matches;

  if (isMobile && window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const keyboardHeight = windowHeight - viewportHeight;

      if (keyboardHeight > 0) {
        // Keyboard is open
        document.body.classList.add('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
        console.log(`[KEYBOARD] Keyboard open. Height: ${keyboardHeight}px`);
      } else {
        // Keyboard is closed
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', '0px');
        console.log('[KEYBOARD] Keyboard closed.');
      }
      // Scroll to bottom of chat area if chat is visible
      if (!chatSection.classList.contains('hidden') && chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
      }
    });
  }
}

// Call the keyboard handler on DOMContentLoaded
document.addEventListener('DOMContentLoaded', handleMobileKeyboard);
