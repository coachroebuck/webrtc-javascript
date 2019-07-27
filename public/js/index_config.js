/*global io*/
/** @type {RTCConfiguration} */
const config = { // eslint-disable-line no-unused-vars
  'iceServers': [{
    'urls': [
    		'stun:stun.l.google.com:19302',
    	]
  }]
};

/*global socket, video, config*/
const peerConnections = {};

/** @type {MediaStreamConstraints} */
const constraints = {
	audio: true,
	video: {facingMode: "user"}
};

const previewView = document.getElementById("preview");
const recordingView = document.getElementById("recording");
const streamingView = document.getElementById("streaming");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const streamButton = document.getElementById("streamButton");
const downloadButton = document.getElementById("downloadButton");
const logElement = document.getElementById("log");

/** 
@type MediaRecorder
This component will store the currently media recorder.
*/
var recorder = null;

/** 
@type MediaStream
This component will store the currently active stream.
*/
var activeStream = null;

/** 
@type Array
This component will store the chunks of data recorded.
*/
let data = [];

/** 
@type Socket 
This socket will allow us to broadcast the video to the STUN server
*/
var socket = null;
/** 
@type WebSocketClient 
This socket will allow us to broadcast the video to the Proxy Web Server,
	which will then send the recording to the Node Media Server
	in RTMP (flv -> mp4) format. 
Users will then have a second option to stream the video through the Node Media Server.
Heads up: There might be a delay.
*/
var ws = null;

const recordingTimeMS = 3000;

window.onunload = window.onbeforeunload = function() {
	if(socket != null) {
		socket.close();
	}
};

