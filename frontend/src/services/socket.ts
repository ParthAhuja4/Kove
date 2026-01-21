import { io, Socket } from "socket.io-client";

const URL = "http://localhost:8002";

export const createSocket = (token: string): Socket => {
  const socket = io(URL, {
    auth: {
      token,
    },
  });

  return socket;
};
