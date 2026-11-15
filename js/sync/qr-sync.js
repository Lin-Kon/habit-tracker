// 100% Offline QR Code Transfer
// Handles JSON minification, lz-string compression, QR canvas rendering, and camera scanning. 
// Load the three lightweight CDN libraries in index.html or dynamically import them here.

export class QrSync {
  // Compress JSON state into a QR canvas element
  async renderToCanvas(stateObject, canvasElement) {
    const minified = JSON.stringify(stateObject);
    const compressed = window.LZString.compressToEncodedURIComponent(minified);

    if (compressed.length > 2200) {
      throw new Error(`Data too large for 1 QR code (${compressed.length} chars).`);
    }

    await window.QRCode.toCanvas(canvasElement, compressed, {
      width: 260,
      margin: 2
    });
  }

  // Start camera scanner and return parsed JSON on success
  startScanner(containerId, onDecoded, onError) {
    const scanner = new window.Html5Qrcode(containerId);
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        try {
          const jsonStr = window.LZString.decompressFromEncodedURIComponent(decodedText);
          const parsed = JSON.parse(jsonStr);
          scanner.stop().catch(() => {});
          onDecoded(parsed);
        } catch (e) {
          onError('Invalid Life OS QR code.');
        }
      }
    ).catch((err) => onError(`Camera error: ${err}`));

    return scanner; // Return instance so UI can call scanner.stop() on modal close
  }
}
