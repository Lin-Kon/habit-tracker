// Unified Hybrid Coordinator
// This is the single file the rest of your app talks to. It resolves conflicts using updatedAt timestamps and bridges wifi-sync.js and qr-sync.js.

import { WifiSync } from './wifi-sync.js';
import { QrSync } from './qr-sync.js';

class SyncManager {
  constructor() {
    this.qr = new QrSync();
    this.status = 'offline';
    this.peerCount = 0;
    this.listeners = new Set();
    this.getState = null;
    this.applyState = null;

    this.wifi = new WifiSync(
      (incoming) => this.handleIncomingData(incoming),
      (status, count) => {
        this.status = status;
        this.peerCount = count;
        this.notifyUI();
      }
    );
  }

  init({ getState, applyState }) {
    this.getState = getState;
    this.applyState = applyState;

    // Generate or load a private 6-character room code for this user
    let roomCode = localStorage.getItem('lifeos_sync_room');
    if (!roomCode) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('lifeos_sync_room', roomCode);
    }

    this.wifi.connect(roomCode, this.getState);

    window.addEventListener('online', () => this.wifi.connect(this.getRoomCode(), this.getState));
    window.addEventListener('offline', () => {
      this.status = 'offline';
      this.notifyUI();
    });
  }

  getRoomCode() {
    return localStorage.getItem('lifeos_sync_room');
  }

  setRoomCode(newCode) {
    const clean = newCode.trim().toUpperCase();
    localStorage.setItem('lifeos_sync_room', clean);
    this.wifi.connect(clean, this.getState);
  }

  // Called by state.js whenever user checks off a habit or edits logs
  pushLocalChange(updatedState) {
    updatedState.updatedAt = Date.now();
    this.wifi.broadcast(updatedState);
  }

  // Handles incoming data from EITHER Wi-Fi WebRTC OR QR Scan
  handleIncomingData(incomingState, forceOverwrite = false) {
    const current = this.getState();
    const isNewer = (incomingState.updatedAt || 0) > (current.updatedAt || 0);

    if (forceOverwrite || isNewer) {
      this.applyState(incomingState);
      this.notifyUI();
    }
  }

  onStatusChange(callback) {
    this.listeners.add(callback);
  }

  notifyUI() {
    this.listeners.forEach((cb) => cb({
      status: this.status,
      peerCount: this.peerCount,
      roomCode: this.getRoomCode()
    }));
  }
}

export const syncManager = new SyncManager();
