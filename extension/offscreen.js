let recorder;
let chunks = [];
let stream;

const PREFERRED_MIME_TYPES = [
  'video/webm; codecs=vp9,opus',
  'video/webm; codecs=vp8,opus',
  'video/webm'
];

console.log('offscreen script loaded. MediaRecorder present:', typeof MediaRecorder !== 'undefined');
console.log('PREFERRED_MIME_TYPES:', PREFERRED_MIME_TYPES);

function reportErrorToBackground(err, details) {
  try {
    function safeClone(obj) {
      if (obj === undefined || obj === null) return null;
      try {
        if (typeof structuredClone === 'function') return structuredClone(obj);
      } catch (e) {}
      try {
        var seen;
        var seenArr;
        if (typeof WeakSet === 'function') {
          seen = new WeakSet();
        } else {
          seenArr = [];
        }
        return JSON.parse(JSON.stringify(obj, function (k, v) {
          if (typeof v === 'bigint') return v.toString() + 'n';
          if (typeof v === 'function') return v.toString();
          if (typeof v === 'symbol') return v.toString();
          if (typeof v === 'object' && v !== null) {
            if (seen) {
              if (seen.has(v)) return '[Circular]';
              seen.add(v);
            } else {
              for (var sidx = 0; sidx < seenArr.length; sidx++) {
                if (seenArr[sidx] === v) return '[Circular]';
              }
              seenArr.push(v);
            }
          }
          return v;
        }));
      } catch (e) {
        try {
          var out = {};
          for (var key in obj) {
            try {
              var val = obj[key];
              if (val === undefined) out[key] = null;
              else if (typeof val === 'bigint' || typeof val === 'symbol' || typeof val === 'function') out[key] = String(val);
              else if (typeof val === 'object' && val !== null) out[key] = '[Object]';
              else out[key] = val;
            } catch (inner) {
              out[key] = String(obj[key]);
            }
          }
          return out;
        } catch (e2) {
          try { return String(obj); } catch (e3) { return null; }
        }
      }
    }

    var safeDetails = safeClone(details);
    try {
      chrome.runtime.sendMessage({
        action: 'RECORDING_FAILED',
        error: err && (err.message || String(err)),
        name: err && err.name,
        stack: err && err.stack,
        details: safeDetails
      });
    } catch (sendErr) {
      console.error('Failed to send error report to background:', sendErr);
    }
  } catch (internalErr) {
    try {
      console.error('reportErrorToBackground internal error:', internalErr);
      chrome.runtime.sendMessage({ action: 'RECORDING_FAILED', error: String(err), reportErrorInternal: String(internalErr) });
    } catch (e) {
      console.error('Failed to send internal report to background:', e);
    }
  }
}

window.addEventListener('error', (e) => {
  reportErrorToBackground(e.error || { message: e.message, name: e.name, stack: e.error && e.error.stack });
});

window.addEventListener('unhandledrejection', (e) => {
  reportErrorToBackground(e.reason || { message: String(e), name: e && e.name, stack: e && e.stack });
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== 'offscreen') return;

  if (message.type === 'start-recording') {
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      var mimeType = '';
      try {
        if (Array.isArray(PREFERRED_MIME_TYPES) && typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
          var len = PREFERRED_MIME_TYPES.length;
          for (var i = 0; i < len; i++) {
            var type = PREFERRED_MIME_TYPES[i];
            if (!type) continue;
            try {
              if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
              }
            } catch (e) {
              console.warn('MediaRecorder.isTypeSupported threw for', type, e);
            }
          }
        } else {
          console.warn('Skipping MIME checks. PREFERRED_MIME_TYPES array present:', Array.isArray(PREFERRED_MIME_TYPES), 'MediaRecorder exists:', typeof MediaRecorder !== 'undefined', 'isTypeSupported:', typeof MediaRecorder.isTypeSupported === 'function');
        }
      } catch (e) {
        console.warn('Error while checking MediaRecorder support:', e);
      }

      console.info(`Attempting MediaRecorder construction; preferred MIME: ${mimeType || '(none)'}`);

      let constructed = false;
      const tried = [];

      if (mimeType) {
        tried.push(mimeType);
        try {
          recorder = new MediaRecorder(stream, { mimeType });
          constructed = true;
        } catch (err) {
          console.warn('MediaRecorder construction failed for', mimeType, err);
        }
      }

      if (!constructed) {
        for (const type of PREFERRED_MIME_TYPES) {
          if (type === mimeType) continue;
          tried.push(type);
          try {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported(type)) continue;
            recorder = new MediaRecorder(stream, { mimeType: type });
            mimeType = type;
            constructed = true;
            break;
          } catch (err) {
            console.warn('MediaRecorder construction failed for', type, err);
          }
        }
      }

      if (!constructed) {
        tried.push('(default)');
        try {
          recorder = new MediaRecorder(stream);
          mimeType = '';
          constructed = true;
        } catch (err) {
          console.error('All MediaRecorder attempts failed. Tried:', tried, err);
          reportErrorToBackground(err, { tried });
          chrome.runtime.sendMessage({ action: 'RECORDING_FAILED', error: err.message, details: { tried } });
          throw err;
        }
      }

      chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          chrome.runtime.sendMessage({ action: 'DOWNLOAD_VIDEO', dataUrl: reader.result });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder Error:", event.error);
        reportErrorToBackground(event.error || { message: event.type || 'Unknown', name: event.type });
        chrome.runtime.sendMessage({ action: 'RECORDING_FAILED', error: (event.error && (event.error.message || event.error.name)) || event.type });
      };

      recorder.start(1000);

    } catch (err) {
      console.error("Failed to start display capture:", err);
      reportErrorToBackground(err);
      chrome.runtime.sendMessage({ action: 'RECORDING_FAILED', error: err.message });
    }
  }

  if (message.type === 'stop-recording' && recorder) {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  }
});