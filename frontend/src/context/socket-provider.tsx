import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/store/store';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// Strip the /api suffix to get the raw server origin for socket.io
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/api\/?$/, '');

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accessToken = useStore.use.accessToken();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setIsConnected(false);
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token: accessToken },
      autoConnect: true,
    });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
