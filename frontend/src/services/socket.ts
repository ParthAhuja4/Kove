import { io, Socket } from "socket.io-client";

const URL = `${import.meta.env.VITE_CHAT_API_BASE}`;

export const createSocket = (token: string): Socket => {
  const socket = io(URL, {
    auth: {
      token,
    },
  });

  return socket;
};
