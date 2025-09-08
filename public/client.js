document.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connect");
  const connectPanel = document.getElementById("connectPanel");
  const roomNameInput = document.getElementById("roomNameInput");
  const watchButton = document.getElementById("watchBtn");
  const connectRoomButton = document.getElementById("connectRoomBtn");
  const createRoomButton = document.getElementById("createRoom");

  const socket = io();

  if (createRoomButton) {
    createRoomButton.addEventListener("click", async () => {
      socket.emit("createRoom", { roomId: "my-room-123" }, (response) => {
        if (response.error) {
          console.error("Room creation failed:", response.error);
        } else {
          console.log("Room created:", response.message);
        }
      });
    });
  }

  if (connectButton) {
    connectButton.addEventListener("click", () => {
      connectPanel.style.display = "block";
      roomNameInput.focus();
    });
  }

  if (watchButton) {
    watchButton.addEventListener("click", async () => {
      const roomName = roomNameInput.value.trim();
      if (!roomName) {
        alert("Please enter a room name");
        return;
      }
      try {
        const resp = await fetch(`/connection/${roomName}/watch`);
        const data = await resp.json();
        console.log("Watch response", data);
        alert(`Watching room: ${data.roomId || roomName}`);
      } catch (err) {
        console.error(err);
        alert("Failed to watch room");
      }
    });
  }

  if (connectRoomButton) {
    connectRoomButton.addEventListener("click", async () => {
      const roomName = roomNameInput.value.trim();
      if (!roomName) {
        alert("Please enter a room name");
        return;
      }
      socket.emit("joinRoom", { roomId: "my-room-123" }, (response) => {
        if (response.error) {
          console.error("Room creation failed:", response.error);
        } else {
          console.log("Room created:", response.message);
        }
      });
    });
  }
});
