"use strict";

function getMethods(obj) {
  var result = [];
  for (var id in obj) {
    try {
      // if (typeof(obj[id]) == "function") {
        result.push(id + ": " + obj[id].toString());
      // }
    } catch (err) {
      result.push(id + ": inaccessible");
    }
  }
  return result;
}

//This serves as a WebServer-RTMP proxy.
const child_process = require('child_process'); // To be used later for running FFmpeg
const express = require('express');
const mkdirp = require('mkdirp');
const path = require('path');
const http = require('http');
const WebSocketServer = require('ws').Server;

// const { spawn } = require('child_process');
// const ls = spawn('ls', ['-lh', '/usr']);

// ls.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
// });

// ls.stderr.on('data', (data) => {
//   console.log(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

const app = express();
const server = http.createServer(app).listen(3002, () => {
  console.log('Listening to port 3002...');
});

// Serve static files out of the www directory, where we will put our HTML page
// app.use(express.static(__dirname + '/www'));

const wss = new WebSocketServer({
  server: server
});

wss.on('error', (ws, id) => {
  ws.close();
    console.log("WSS Error: Web socket server closed...");
})

wss.on('close', (ws, id) => {
  ws.close();
    console.log("WSS Close: Web socket server closed...");
})

wss.on('connection', (ws, id) => {

  console.log(ws.constructor.name)
  console.log(ws.upgradeReq.url)
  // Ensure that the URL starts with '/rtmp/', and extract the target RTMP URL.
  let match;
  if ( !(match = ws.upgradeReq.url.match(/^\/rtmp\/(.*)$/)) ) {
    ws.terminate(); // No match, reject the connection.
    return;
  }

  const username = decodeURIComponent(match[1]);
  console.log('Target username:', username);
  
  const dir = __dirname + path.sep + "media" + path.sep + "live" + path.sep + username + path.sep;
  mkdirp(dir, function(err) { 
      // path exists unless there was an error
      if(err != null) {
        console.log("Error creating directory: ", err);
        return;
      }

  });

  var ts = Math.round((new Date()).getTime() / 1000) + 3600;
  const physicalPath = dir + path.sep + ts + ".mp4";
  console.log('Physical Path:', physicalPath);
  
  // Launch FFmpeg to handle all appropriate transcoding, muxing, and RTMP.
  // If 'ffmpeg' isn't in your path, specify the full path to the ffmpeg binary.
  const ffmpeg = child_process.spawn('ffmpeg', [
    // Facebook requires an audio track, so we create a silent one here.
    // Remove this line, as well as `-shortest`, if you send audio from the browser.
    // '-f', 'lavfi', '-i', 'anullsrc',
    
    // FFmpeg will read input video from STDIN
    '-i', '-',
    
    // Because we're using a generated audio source which never ends,
    // specify that we'll stop at end of other input.  Remove this line if you
    // send audio from the browser.
    // '-shortest',
    
    '-c', 'copy', '-movflags', 'faststart',
    // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
    // so that we don't waste any CPU and quality with unnecessary transcoding.
    // If the browser doesn't support H.264, set the video codec to 'libx264'
    // or similar to transcode it to H.264 here on the server.
    '-vcodec', 'copy',
    
    // AAC audio is required for Facebook Live.  No browser currently supports
    // encoding AAC, so we must transcode the audio to AAC here on the server.
    '-acodec', 'mp3',
    
    // FLV is the container format used in conjunction with RTMP
    '-f', 'mp4',
    
    // Sample rate of the output file
    '-ar', '44100', 

    // The output RTMP URL.
    // For debugging, you could set this to a filename like 'test.flv', and play
    // the resulting file with VLC.  Please also read the security considerations
    // later on in this tutorial.
    // physicalPath

      //If I want to send this to the Node Media Server, comment the above line
      // and uncomment this line instead
    rtmpUrl,
  ]);
  
  // If FFmpeg stops for any reason, close the WebSocket connection.
  ffmpeg.on('close', (code, signal) => {
    console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
    ws.close();
  });
  
  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on('error', (e) => {
    console.log('FFmpeg STDIN Error', e);
  });
  
  ffmpeg.stdin.on('close', (e) => {
    console.log('FFmpeg STDIN Closed!', e);
  });
  
  ffmpeg.stdout.on('close', (e) => {
    console.log('FFmpeg STDOUT Closed!', e);
  });
  
  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on('data', (data) => {
    console.log('FFmpeg STDERR:', data.toString(), "\n");
  });

  // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
  ws.on('message', (msg) => {
    // console.log('DATA', msg);
    ffmpeg.stdin.write(msg);
  });
  
  // If the client disconnects, stop FFmpeg.
  ws.on('close', (e) => {
    console.log("WS Close: Web socket server closed...");
    ffmpeg.stdin.destroy();
  });
  
  // If the client disconnects, stop FFmpeg.
  ws.on('error', (e) => {
    console.log("WS Error: Web socket server closed due to error...");
    ffmpeg.stdin.destroy();
  });
})