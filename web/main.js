// State
let mediaRecorder;
let recordedChunks = [];
let stream = null;
let startTime;
let timerInterval;

// Elements
const previewElement = document.getElementById('preview');
const emptyState = document.getElementById('empty-state');
const startBtn = document.getElementById('btn-start');
const stopBtn = document.getElementById('btn-stop');
const snapshotBtn = document.getElementById('btn-snapshot');
const statusBadge = document.getElementById('status-badge');
const timeDisplay = document.getElementById('timer');
const detailsMsg = document.getElementById('details-msg');
const snapshotCanvas = document.getElementById('snapshot-canvas');

// Timer function
function updateTimer() {
  const elapsed = Date.now() - startTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  timeDisplay.textContent = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function startRecording() {
  try {
    // Request screen capture along with system audio (requires user to tick "Share Audio" box in prompt)
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: true
    });

    // Setup Video Preview
    previewElement.srcObject = stream;
    previewElement.style.display = 'block';
    emptyState.style.display = 'none';

    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const hasAudio = stream.getAudioTracks().length > 0;
    
    detailsMsg.textContent = `Capturing ${settings.width}x${settings.height} | Audio: ${hasAudio ? 'Yes' : 'No'}`;

    // Setup MediaRecorder
    let options = { mimeType: 'video/webm; codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm; codecs=vp8' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = saveRecording;

    // Handle user stopping via browser's built in UI (the "Stop sharing" button)
    videoTrack.onended = () => {
      stopRecording();
    };

    mediaRecorder.start(100);

    // UI Updates
    startBtn.disabled = true;
    stopBtn.disabled = false;
    snapshotBtn.disabled = false;
    
    statusBadge.textContent = 'Recording';
    statusBadge.classList.add('recording');
    
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

  } catch (error) {
    console.error("Error starting recording:", error);
    detailsMsg.textContent = `Error: ${error.message}`;
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // UI Updates
  clearInterval(timerInterval);
  startBtn.disabled = false;
  stopBtn.disabled = true;
  snapshotBtn.disabled = true;
  
  statusBadge.textContent = 'Idle';
  statusBadge.classList.remove('recording');

  previewElement.srcObject = null;
  previewElement.style.display = 'none';
  emptyState.style.display = 'flex';
  detailsMsg.textContent = 'Recording saved locally.';
  timeDisplay.textContent = "00:00:00";
}

function saveRecording() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = url;
  
  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
  a.download = `screen_recording_${timestamp}.webm`;
  
  a.click();
  window.URL.revokeObjectURL(url);
  recordedChunks = [];
}

function takeSnapshot() {
  if (!stream || !previewElement.videoWidth) return;

  const width = previewElement.videoWidth;
  const height = previewElement.videoHeight;
  
  // Set canvas size equal to the exact video dimensions to capture a high quality frame
  snapshotCanvas.width = width;
  snapshotCanvas.height = height;
  
  const ctx = snapshotCanvas.getContext('2d');
  ctx.drawImage(previewElement, 0, 0, width, height);

  const snapshotUrl = snapshotCanvas.toDataURL('image/png');
  
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = snapshotUrl;
  
  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
  a.download = `snapshot_${timestamp}.png`;
  
  a.click();
  document.body.removeChild(a);

  const originalHtml = snapshotBtn.innerHTML;
  snapshotBtn.innerHTML = 'Saved!';
  setTimeout(() => {
    snapshotBtn.innerHTML = originalHtml;
  }, 1500);
}

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
snapshotBtn.addEventListener('click', takeSnapshot);
