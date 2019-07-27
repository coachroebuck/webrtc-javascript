# WebRTC Video Broadcast

Sends video from a device (broadcast.html) to a viewer (index.html) over WebRTC.

Uses WebRTC's getUserMedia(), RTCPeerConnection(), `<video>`, `<canvas>`, Node.js and Socket.io

[Slides](http://slides.com/basscord/webrtc-video-streaming/) | [Broadcaster](https://video-chat.basscord.co:8888/broadcast.html) | [Viewer](https://video-chat.basscord.co:8888)

To broadcast to Node Media Server:
rtmp://<ip_address>:1935/live/<username>?sign=<timestamp>-<hashValue>

To stream from Node Media Server:
ws://<ip_address>:8000/live/<username>.flv
http://<ip_address>:8000/live/<username>.flv

You'll need to run these commands:
```
node server.js
node proxy.js
```