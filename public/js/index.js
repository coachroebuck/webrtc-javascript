const userId = "coachroebuck";

function log(msg) {
  logElement.innerHTML += msg + "\n";
}
function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}
function createWebSocket(stream, lengthInMS) {
    recorder = new MediaRecorder(stream);
    
    data = [];

    activeStream = stream;
    logElement.innerHTML = "";

    try {
        var url = getStreamUrl();
        
        log("publishing to: " + url);

        ws = new WebSocket(url);

         // When the connection is open, send some data to the server
        ws.onopen = function () {
            log("connected to " + url + "...");
          // ws.send('Ping'); // Send the message 'Ping' to the server
        };

        // Log errors
        ws.onerror = function (error) {
          console.log('WebSocket Error ' + error);
          log("Web socket error: " + error.message + "=[" + url + "]");
        };

        // Log messages from the server
        ws.onmessage = function (e) {
          console.log('Server: ' + e.data);
          log("Received message from server...");
        };

        ws.onclose = function (e) {
            console.log('Web socket connection closed. ' + error.reason);
        };
    }
    catch(err) {
      log("Connection Error: " + err.message);
    }

  recorder.ondataavailable = function(event) {
    data.push(event.data);
    ws.send(event.data);
  } 

  recorder.start(100);
}

function stop(stream) {
  stream.getTracks().forEach(track => track.stop());
}

function pause(stream) {
  stream.getTracks().forEach(track => track.pause());
}

function resume(stream) {
  stream.getTracks().forEach(track => track.resume());
}

startButton.addEventListener("click", function() {
  startRecording();
}, false);

stopButton.addEventListener("click", function() {
    stopRecording();
}, false);

function startRecording() {
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    previewView.srcObject = stream;
    downloadButton.href = stream;
    broadcastVideo();
    previewView.captureStream = previewView.captureStream || previewView.mozCaptureStream;
      return new Promise(resolve => previewView.onplaying = resolve);
  }).then(() => createWebSocket(previewView.captureStream(), recordingTimeMS))
}

function getStreamUrl() {
  var portId = 3002;
  var protocol = window.location.protocol;
  var hostname = window.location.hostname;
  var ts = Math.round((new Date()).getTime() / 1000) + 3600;
  var hash = md5("/live/stream-" + ts + "-nodemedia2017privatekey");

  //If I want to send the data to the Node Media Server, uncomment this line
  var rtmp = "rtmp://" + hostname + ":1935/live/coachroebuck?sign=" + ts + "-" + hash;

  //If I want to allow the proxy to do all the work, uncomment this line.
  // var rtmp = "coachroebuck";

  var url =  protocol.replace('http', 'ws') + '//' + // http: -> ws:, https: -> wss:
          hostname + ":" + portId + 
          '/rtmp/' + 
          encodeURIComponent(rtmp);
  return url;
}

function stopRecording() {
  stop(previewView.srcObject);
  buildDownloadLink(data);
  stopBroadcasting();

  if(recorder.state == "recording") {
    recorder.stop();
  } 
  
  if(ws != null) {
    ws.close(1000);
    ws = null;
  }
}

function buildDownloadLink(recordedChunks) {
  let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
  let now = new Date();
  let fileName = "recording-"
      + now.getFullYear() + "-"
      + (now.getMonth() + 1).toString().padStart(2, '0') + "-"
      + now.getDay().toString().padStart(2, '0') + "--"
      + now.getHours().toString().padStart(2, '0') + "-"
      + now.getMinutes().toString().padStart(2, '0') + "-"
      + now.getSeconds().toString().padStart(2, '0') + ".webm";
  
  recordingView.src = URL.createObjectURL(recordedBlob);
  downloadButton.href = recordingView.src;
  downloadButton.download = fileName;
  log("Successfully recorded " + recordedBlob.size + " bytes of " +
      recordedBlob.type + " media."
      + "<br />Download: " + fileName);
}
