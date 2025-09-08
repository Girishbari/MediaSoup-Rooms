import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { User, Meeting, Participant } from './types/generalTypes';
import { randomUUID } from 'crypto';
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { SocketService } from "./services/socketService";

const port = Number(process.env.PORT) || 4000;

const app = express();

const httpServer = createServer(app);

new SocketService(httpServer);

const databaseDir = path.resolve(__dirname, '../database');
const usersFile = path.join(databaseDir, 'users.json');
const meetingsFile = path.join(databaseDir, 'meetings.json');
const participantsFile = path.join(databaseDir, 'participants.json');

let users: User[] = [];
let meetings: Meeting[] = [];

app.use(morgan('dev'));
app.use(express.json());


const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

// Ensure database directory and files exist and hydrate in-memory state
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

function safeReadJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (raw.length === 0) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read JSON from ${filePath}:`, err);
    return fallback;
  }
}

function safeWriteJSON(filePath: string, data: unknown) {
  fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      console.error(`Failed to write JSON to ${filePath}:`, err);
    }
  });
}

users = safeReadJSON<User[]>(usersFile, []);
meetings = safeReadJSON<Meeting[]>(meetingsFile, []);
// Ensure participants file exists even if unused for now
safeReadJSON<Participant[]>(participantsFile, []);

app.post('/stream', (req: Request, res: Response) => {
  const { username, gmail } = req.body;
  if (!username || !gmail) {
    return res.status(400).json({ error: 'username and gmail are required' });
  }
  const user_id = "user_" + randomUUID();
  const roomId = "meeting_" + randomUUID();

  users.push({ id: user_id, username, gmail });
  safeWriteJSON(usersFile, users);

  const newMeeting: Meeting = { id: roomId, created_at: new Date().toISOString() };
  meetings.push(newMeeting);
  safeWriteJSON(meetingsFile, meetings);

  return res.json({ roomId });
});

app.get('/connection/:roomId/:type', (req: Request, res: Response) => {
  const { type, roomId } = req.params as { type: string; roomId: string };
  if (type === 'stream' || type === 'watch') {
    return res.json({ roomId });
  }
  return res.status(400).json({ error: 'type must be stream or watch' });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('ok');
});


app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
