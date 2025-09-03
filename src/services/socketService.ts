import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { SocketEvents } from "../types/socketTypes";

type SocketClientCallback<T> = (response?: T) => void;

// temp class
class Room {
  private _roomId: string;
  private _io: SocketIOServer;
  private _worker: any;
  public _peers: Map<string, {}>;

  constructor(roomId: string, io: SocketIOServer, worker: any) {
    this._roomId = roomId;
    this._io = io;
    this._worker = worker;
    this._peers = new Map();
  }

  // can be a private function and we can inherit this class to socket

  public get id() {
    return this._roomId;
  }

  public createPeer(name: string, socketId: string) {
    return {
      id: socketId,
      name,
    };
  }

  public removePeer(socketId: string) {
    return {
      id: socketId,
      name: "Guest",
    };
  }

  public getPeers() {
    return new Map<string, {}>();
  }
}

export class SocketService {
  private _io: SocketIOServer;
  private _roomList: Map<string, Room>;

  constructor(httpServer: HTTPServer) {
    this._io = new SocketIOServer(httpServer);
    this._roomList = new Map<string, Room>();
    try {
      this.StartListeningWSS(this._io);
    } catch (error) {
      console.error("Error starting WSS", error);
    }
  }

  private StartListeningWSS(io: SocketIOServer) {
    io.on("connection", (socket: Socket & { room_id?: string }) => {
      socket.on(
        SocketEvents.CREATE_ROOM,
        ({ roomId }, cb: SocketClientCallback<{}>) => {
          if (!roomId) {
            console.error("No room id provided to create room ", socket.id);
            cb({ error: "No room id provided to create room" });
            return;
          }
          const room = this._roomList.get(roomId);

          if (room) {
            console.log("Room already present");
            cb({ error: "Room already present" });
            return;
          } else {
            //const worker = getMediasoupWorker();
            const worker = "worker";
            this._roomList.set(roomId, new Room(roomId, io, worker));
            console.log("Room created successfully ", { roomId });
            cb({ message: "Room created successfully" });
          }
        }
      );

      socket.on(
        SocketEvents.JOIN_ROOM,
        ({ roomId, name }, cb: SocketClientCallback<{}>) => {
          const room = this._roomList.get(roomId);

          if (!room) {
            cb({ error: "Room Doesn't exists" });
            return;
          }

          const peer = room.createPeer(name, socket.id);
          socket.to(roomId).emit(SocketEvents.USER_JOINED, {
            message: `${name} is in the House`,
            user: peer,
          });

          socket.join(roomId);
          socket.room_id = roomId;
          console.log("Room Joined Successfully", { name, roomId });

          cb({ message: "Room Joined successfully" });
        }
      );

      socket.on(SocketEvents.LEAVE_ROOM, (_, cb: SocketClientCallback<{}>) => {
        if (!socket.room_id) {
          cb({ error: "Not already in any room" });
          return;
        }

        const room = this._roomList.get(socket.room_id);
        if (!room) {
          cb({ error: "Exiting room doesn't exists" });
          return;
        }

        const peer = room.removePeer(socket.id);
        if (room._peers.size <= 0) {
          this._roomList.delete(room.id);
        }

        socket.to(room.id).emit(SocketEvents.USER_LEFT, {
          message: `${peer?.name} left the room.`,
          user: peer,
        });
      });

      socket.on(
        SocketEvents.GET_ROOM_TOTAL_USERS,
        (_, cb: SocketClientCallback<{}>) => {
          if (!socket.room_id) {
            cb({ error: "Not already in any room" });
            return;
          }
          const room = this._roomList.get(socket.room_id);

          if (!room) {
            console.log("No room present with the id");
            return;
          }
          cb({ users: room.getPeers() });
        }
      );
    });
  }
}
