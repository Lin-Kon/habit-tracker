// Live Real-Time Wi-Fi Sync
// Handles background WebRTC room connections using a user-configurable room PIN so different Life OS users don't collide.

import { joinRoom } from 'https://esm.sh';

export class WifiSync {
  constructor(onDataReceived, onStatusChange) {
    this.onDataReceived = onDataReceived;
    this.onStatusChange = onStatusChange;
    this.sendAction = null;
    this.room = null;
    this.peers = new Set();
  }

  connect(roomCode, getCurrentState) {
    this.disconnect();
    if (!navigator.onLine || !roomCode) {
      this.onStatusChange('offline', 0);
      return;
    }

    try {
      const config = { appId: 'life-os-habit-tracker-v1' };
      this.room = joinRoom(config, `lifeos-${roomCode}`);
      const [send, receive] = this.room.makeAction('stateSync');
      this.sendAction = send;

      this.onStatusChange('online', 0);

      this.room.onPeerJoin((peerId) => {
        this.peers.add(peerId);
        this.onStatusChange('connected', this.peers.size);
        // Send latest local JSON to newly joined device
        this.sendAction(getCurrentState(), peerId);
      });

      this.room.onPeerLeave((peerId) => {
        this.peers.delete(peerId);
        this.onStatusChange(this.peers.size > 0 ? 'connected' : 'online', this.peers.size);
      });

      receive((incomingState) => {
        this.onDataReceived(incomingState);
      });
    } catch (err) {
      this.onStatusChange('error', 0);
    }
  }

  broadcast(state) {
    if (this.sendAction && navigator.onLine && this.peers.size > 0) {
      this.sendAction(state);
    }
  }

  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.peers.clear();
    }
  }
}