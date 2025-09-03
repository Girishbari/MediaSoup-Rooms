export type User = {
  id: string;
  username: string;
  gmail: string;
};

export type Meeting = {
  id: string;
  created_at: string;
};


export type Participant = {
  id: string;
  meeting_id: string;
  user_id: string;
  created_at: string;
  type: 'spectator' | 'participant';
};