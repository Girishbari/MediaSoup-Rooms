document.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connect");
  const connectPanel = document.getElementById("connectPanel");
  const roomNameInput = document.getElementById("roomNameInput");
  const watchButton = document.getElementById("watchBtn");
  const connectRoomButton = document.getElementById("connectRoomBtn");
  const createRoomButton = document.getElementById("createRoom");

  if (createRoomButton) {
    createRoomButton.addEventListener("click", async () => {
      try {
        const resp = await fetch("/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            gmail: "test@gmail.com",
          }),
        });
        const data = await resp.json();
        console.log("Create room response", data);
        alert(`Created room: ${data.roomId}`);
      } catch (err) {
        console.error(err);
        alert("Failed to create room");
      } finally {
        connectPanel.style.display = "hidden";
        roomNameInput.focus();
      }
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
      try {
        const resp = await fetch("/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "test", gmail: "test@gmail.com" }),
        });
        const data = await resp.json();
        console.log("Connect response", data);
        alert(`Connected to room: ${data.roomId || roomName}`);
      } catch (err) {
        console.error(err);
        alert("Failed to connect to room");
      }
    });
  }
});
