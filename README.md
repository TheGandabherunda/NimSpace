# NimSpace 🌐✨  
**Seamless, serverless peer-to-peer communication, file sharing, and synchronized media experiences**

![NIMFILE Logo](/assets/icon.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) 
[![Live Demo](https://img.shields.io/badge/%F0%9F%9A%80-Live_Demo-green)](https://projectsolutus.github.io/NimSpace/)  <!-- Replace with your actual URL -->

## Key Features 🚀

| Feature | Description |
|---------|-------------|
| 🔒 **Private Chat** | End-to-end encrypted messaging with no central servers |
| 📁 **File Sharing** | Transfer files of any size directly between peers |
| 🎬 **Binge Mode** | Synchronized watching/listening (supports URLs, local files & torrents) |
| 🌙 **Theme Toggle** | Switch between light/dark mode with one click |
| 📱 **Mobile Optimized** | Responsive design with keyboard-aware UI |

## Try It Now!
[👉 **Live Demo**](https://projectsolutus.github.io/NimSpace/) <!-- Hyperlink for visibility -->

## How It Works

### 🎮 Hosting a Session
1. Open NimSpace in your browser
2. Click **"Start Session"**
3. Share the generated link or QR code with friends

### 🤝 Joining a Session
1. Open the host's invitation link
2. That's it! You're connected

### ✨ Core Features
- **Chat**: Type messages and press <kbd>Enter</kbd> to send
- **Files**: Click the 📎 icon to send/receive files
- **Binge Mode**:
  - Host clicks the 🎫 icon
  - Choose from:
    - Streaming URLs (YouTube/Spotify/Drive)
    - Local media files
    - Torrent magnet links
  - All peers sync automatically
- **Themes**: Toggle between light/dark mode

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Google Material Icons

### P2P Magic
- **PeerJS** for WebRTC connections
- **WebTorrent.js** for torrent streaming
- **QRCode.js** for session sharing
- **StreamSaver.js** for efficient file downloads

## Development

### Quick Start
```bash
git clone https://github.com/ProjectSolutus/NimSpace.git
cd NimSpace
python -m http.server 8000  # Or `npx http-server`
