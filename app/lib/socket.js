"use client";
import { io } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://quizhubapi.onrender.com";

export const socket = io(URL, {
  autoConnect: false,
  transports:["websocket"],      //only allow websocket
  upgrade: false,     //prevent fallback to polling
});
