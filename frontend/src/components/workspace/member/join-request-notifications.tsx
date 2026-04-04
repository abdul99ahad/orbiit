import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/context/socket-provider';
import { useAuthContext } from '@/context/auth-provider';
import { respondToJoinRequestMutationFn } from '@/lib/api';
import { Permissions } from '@/constant';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { toast } from '@/hooks/use-toast';

type JoinRequestPayload = {
  requestId: string;
  workspaceId: string;
  workspaceName: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture: string;
  };
};

const JoinRequestCard = ({
  request,
  onDismiss,
}: {
  request: JoinRequestPayload;
  onDismiss: (requestId: string) => void;
}) => {
  const queryClient = useQueryClient();
  const { mutate: respond, isPending } = useMutation({
    mutationFn: respondToJoinRequestMutationFn,
  });

  const handleRespond = (action: 'approved' | 'denied') => {
    respond(
      { workspaceId: request.workspaceId, requestId: request.requestId, action },
      {
        onSuccess: () => {
          onDismiss(request.requestId);
          if (action === 'approved') {
            queryClient.invalidateQueries({ queryKey: ['members', request.workspaceId] });
            toast({
              title: 'Approved',
              description: `${request.user.name} has joined ${request.workspaceName}.`,
              variant: 'success',
            });
          } else {
            toast({
              title: 'Denied',
              description: `${request.user.name}'s request was denied.`,
            });
          }
        },
        onError: (error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const initials = getAvatarFallbackText(request.user.name);
  const avatarColor = getAvatarColor(request.user.name);

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 w-80 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={request.user.profilePicture || ''} alt={request.user.name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{request.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{request.user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              wants to join <span className="font-medium">{request.workspaceName}</span>
            </p>
          </div>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => onDismiss(request.requestId)}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          disabled={isPending}
          onClick={() => handleRespond('approved')}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          disabled={isPending}
          onClick={() => handleRespond('denied')}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Deny
        </Button>
      </div>
    </div>
  );
};

const JoinRequestNotifications = () => {
  const { socket } = useSocket();
  const { hasPermission } = useAuthContext();
  const [requests, setRequests] = useState<JoinRequestPayload[]>([]);

  const canManageRequests = hasPermission(Permissions.ADD_MEMBER);

  useEffect(() => {
    if (!socket || !canManageRequests) return;

    const handleJoinRequest = (payload: JoinRequestPayload) => {
      setRequests((prev) => {
        // Avoid duplicate notifications for the same request
        if (prev.some((r) => r.requestId === payload.requestId)) return prev;
        return [...prev, payload];
      });
    };

    socket.on('join:request', handleJoinRequest);
    return () => {
      socket.off('join:request', handleJoinRequest);
    };
  }, [socket, canManageRequests]);

  const dismiss = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {requests.map((req) => (
        <JoinRequestCard key={req.requestId} request={req} onDismiss={dismiss} />
      ))}
    </div>
  );
};

export default JoinRequestNotifications;
