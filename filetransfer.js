// filetransfer.js - File transfer feature module
// This file encapsulates file sending, receiving, progress UI, and file message handling from main.js

// --- File Transfer State ---
export const fileTransfers = {};

// --- File Message UI ---
export function addFileMessage({ fileMsgId, fileName, fileSize, senderId, username, timestamp }) {
  const chatArea = document.getElementById('chatArea');
  if (!chatArea) return;
  if (chatArea.querySelector(`[data-file-msg-id="${fileMsgId}"]`)) return;
  const div = document.createElement('div');
  div.className = 'message-tile file ' + (senderId === window.myPeerId ? 'outgoing' : 'incoming');
  div.dataset.fileMsgId = fileMsgId;
  div.setAttribute('data-file-msg-id', fileMsgId);
  div.innerHTML = `
    <div class="message-header">
      <span class="message-user-dot" style="background:${window.usernameColor ? window.usernameColor(username) : '#888'};"></span>
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
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// --- File Message Handling ---
export function handleFileMessage(msg) {
  if (!window.normalChatHistory.find(m => m.type === 'file' && m.fileMsgId === msg.fileMsgId)) {
    window.normalChatHistory.push(msg);
  }
  if (!fileTransfers[msg.fileMsgId]) fileTransfers[msg.fileMsgId] = {};
  if (!fileTransfers[msg.fileMsgId][window.myPeerId]) {
    fileTransfers[msg.fileMsgId][window.myPeerId] = { status: 'ready', progress: 0, controller: null };
  }
  addFileMessage(msg);
  if (!window.streamSaver) {
    const tile = document.getElementById('chatArea').querySelector(`[data-file-msg-id="${msg.fileMsgId}"]`);
    if (tile) {
      updateFileTileUI(tile, { status: 'canceled', progress: 0, error: 'streamSaver.js not loaded. Please reload or contact the host.' });
      alert('File download requires streamSaver.js. Please reload the page or contact the host.');
    }
  }
}

// --- File Tile UI Update (stub for now) ---
export function updateFileTileUI(tile, { status, progress, error, reason, source }) {
  // Implementation will be completed during integration
}

// --- Export for integration ---
export default {
  addFileMessage,
  formatFileSize,
  handleFileMessage,
  updateFileTileUI,
  fileTransfers
}; 