// chat.js - Chat feature module
// This file encapsulates chat UI, message handling, and chat history logic from main.js

// --- Chat State ---
export let normalChatHistory = [];
export let bingeChatHistory = [];
export let chatMode = 'normal'; // 'normal' or 'binge'
export let knownMsgIds = new Set();

// --- Chat UI Functions ---
export function addChatMessage({ senderId, text, username, timestamp, color }) {
  const chatArea = document.getElementById('chatArea');
  if (!chatArea) return;
  const div = document.createElement('div');
  div.className = 'message-tile ' + (senderId === window.myPeerId ? 'outgoing' : 'incoming');
  div.innerHTML = `
    <div class="message-header">
      <span class="message-user-dot" style="background:${color};"></span>
      <span class="message-username">${username}</span>
      <span class="message-timestamp">${timestamp}</span>
    </div>
    <div class="message-content"></div>`;
  div.querySelector('.message-content').textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

export function renderChatHistory() {
  const chatArea = document.getElementById('chatArea');
  if (!chatArea) return;
  chatArea.innerHTML = '';
  if (chatMode === 'binge') {
    bingeChatHistory.forEach(msg => {
      addChatMessage(msg);
    });
  } else {
    normalChatHistory.forEach(msg => {
      if (msg.type === 'file') {
        // Placeholder: file messages handled in filetransfer.js
      } else {
        addChatMessage(msg);
      }
    });
  }
}

export function switchToNormalChat() {
  chatMode = 'normal';
  renderChatHistory();
}
export function switchToBingeChat() {
  chatMode = 'binge';
  renderChatHistory();
}

// --- Message Handling ---
export function handleIncomingChatMessage(data, fromPid) {
  if (knownMsgIds.has(data.msgId)) return;
  knownMsgIds.add(data.msgId);
  const msg = {
    senderId: data.senderId || data.meshFrom || fromPid,
    text: data.text,
    username: data.username || (window.peerUsernames && window.peerUsernames[fromPid]) || fromPid,
    timestamp: data.timestamp || new Date().toLocaleTimeString(),
    color: (window.usernameColor && window.usernameColor(data.username || (window.peerUsernames && window.peerUsernames[fromPid]) || fromPid)) || '#888',
    msgId: data.msgId
  };
  if (data.chatMode === 'binge') {
    bingeChatHistory.push(msg);
    if (chatMode === 'binge') addChatMessage(msg);
  } else {
    normalChatHistory.push(msg);
    if (chatMode === 'normal') addChatMessage(msg);
  }
}

// --- Export for integration ---
export default {
  addChatMessage,
  renderChatHistory,
  switchToNormalChat,
  switchToBingeChat,
  handleIncomingChatMessage,
  normalChatHistory,
  bingeChatHistory,
  chatMode,
  knownMsgIds
}; 