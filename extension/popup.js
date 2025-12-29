document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'START_RECORDING' });
  window.close();
});

document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
  window.close();
});