const newMessageTextField = document.getElementById("newMessage");
const postMessageButton = document.getElementById("postMessageButton");
const chatView = document.getElementById("chat");

postMessageButton.addEventListener("click", function() {
    sendNewMessage();
}, false);

function sendNewMessage() {
  var text = newMessageTextField.value;
  var json = {};
  json["user"] = userId;
  json["message"] = text;

  socket.emit('message', JSON.stringify(json));
  newMessageTextField.value = "";
}

