import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/store';
import { toast } from '@/hooks/use-toast';

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

    s.on('workspace:kicked', (payload: { workspaceName: string }) => {
      // Invalidate workspace list so the sidebar refreshes without the removed workspace
      queryClient.invalidateQueries({ queryKey: ['userWorkspaces'] });
      // Navigate to "/" — AuthRoute will redirect to their own currentWorkspace
      navigate('/');
      toast({
        title: 'Removed from workspace',
        description: `You have been removed from "${payload.workspaceName}".`,
        variant: 'destructive',
      });
    });

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
