// peer.js - Peer management and PeerJS logic module
// This file encapsulates connection setup, mesh management, user list, and status from main.js

// --- Peer State ---
export let peer = null;
export let myPeerId = null;
export let joinPeerId = null;
export let isHost = false;
export let mesh = {};                // pid → { conn, status, backoff, lastPing }
export let myUsername = "";
export let peerUsernames = {};        // pid → username
export let assignedNames = {};
export let userCount = 0;

// --- Peer Management Functions (stubs for now) ---
export function setupConnHandlers(conn, pid, isIncoming) {}
export function tryConnectTo(pid, backoff) {}
export function scheduleReconnect(pid) {}
export function updatePeersList() {}
export function broadcastData(msg, exceptPeerId) {}
export function sendHistoryToPeer(conn) {}
export function getPeerIdFromURL() {}
export function setStatus(msg) {}
export function assignDefaultUsernameToPeer(pid) {}
export function assignHostName() {}
export function getPeerStatus(pid) {}
export function getAllStatuses() {}
export function broadcastUserListWithStatus() {}

// --- Export for integration ---
export default {
  setupConnHandlers,
  tryConnectTo,
  scheduleReconnect,
  updatePeersList,
  broadcastData,
  sendHistoryToPeer,
  getPeerIdFromURL,
  setStatus,
  assignDefaultUsernameToPeer,
  assignHostName,
  getPeerStatus,
  getAllStatuses,
  broadcastUserListWithStatus,
  peer,
  myPeerId,
  joinPeerId,
  isHost,
  mesh,
  myUsername,
  peerUsernames,
  assignedNames,
  userCount
}; 