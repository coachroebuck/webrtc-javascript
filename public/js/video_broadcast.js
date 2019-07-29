let now = new Date();
  let timestamp = "recording-"
      + now.getFullYear() + "-"
      + (now.getMonth() + 1).toString().padStart(2, '0') + "-"
      + now.getDay().toString().padStart(2, '0') + "--"
      + now.getHours().toString().padStart(2, '0') + "-"
      + now.getMinutes().toString().padStart(2, '0') + "-"
      + now.getSeconds().toString().padStart(2, '0');
const userName = "coachroebuck";
const userColor = "#C28100";
const myVideoView = document.getElementById("my_video");
const newMessageTextField = document.getElementById("newMessageTextField");
const postMessageButton = document.getElementById("postMessageButton");
const chatView = document.getElementById("chat");

let videoBroadcaster = new VideoBroadcaster(myVideoView);

myVideoView.addEventListener("click", function() {
	if(videoBroadcaster.isBroadcasting()) {
		videoBroadcaster.stop();
	}
	else {
		videoBroadcaster.start();
	}
}, false);

postMessageButton.addEventListener("click", function(event) {
  	event.preventDefault()
    videoBroadcaster.sendNewMessage(newMessageTextField.value);
    newMessageTextField.value = "";
}, false);
