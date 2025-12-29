chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'START_RECORDING') {
    const existing = await chrome.offscreen.hasDocument?.() || false;
    if (!existing) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DISPLAY_MEDIA'],
        justification: 'Capture screen for AI guide generation'
      });
    }
    chrome.runtime.sendMessage({ type: 'start-recording', target: 'offscreen' });
  }

  if (message.action === 'STOP_RECORDING') {
    chrome.runtime.sendMessage({ type: 'stop-recording', target: 'offscreen' });
  }

  if (message.action === 'DOWNLOAD_VIDEO') {
    chrome.downloads.download({
      url: message.dataUrl,
      filename: 'clueso-capture.webm',
      saveAs: true
    }, () => {
      chrome.offscreen.closeDocument();
    });
  }

  if (message.action === 'RECORDING_FAILED') {
    console.error('Recording failed (offscreen):', message);
  }
});