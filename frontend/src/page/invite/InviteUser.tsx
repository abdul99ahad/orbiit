import { useEffect, useState } from 'react';
import { Clock, Loader, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { BASE_ROUTE } from '@/routes/common/routePaths';
import useAuth from '@/hooks/api/use-auth';
import { useMutation } from '@tanstack/react-query';
import { requestJoinWorkspaceMutationFn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useSocket } from '@/context/socket-provider';

type JoinStatus = 'idle' | 'pending' | 'approved' | 'denied';

const InviteUser = () => {
  const navigate = useNavigate();
  const param = useParams();
  const inviteCode = param.inviteCode as string;
  const { data: authData, isPending } = useAuth();
  const user = authData?.user;
  const { socket } = useSocket();

  const [joinStatus, setJoinStatus] = useState<JoinStatus>('idle');
  const [requestId, setRequestId] = useState<string | null>(null);

  const returnUrl = encodeURIComponent(
    `${BASE_ROUTE.INVITE_URL.replace(':inviteCode', inviteCode)}`
  );

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: requestJoinWorkspaceMutationFn,
  });

  // Listen for approval/denial via WebSocket
  useEffect(() => {
    if (!socket || !requestId) return;

    const handleResponse = (payload: {
      requestId: string;
      status: 'approved' | 'denied';
      workspaceId: string;
    }) => {
      if (payload.requestId !== requestId) return;

      setJoinStatus(payload.status);

      if (payload.status === 'approved') {
        toast({
          title: 'Request approved!',
          description: 'You have been added to the workspace.',
          variant: 'success',
        });
        setTimeout(() => navigate(`/workspace/${payload.workspaceId}`), 1500);
      }
    };

    socket.on('join:response', handleResponse);
    return () => {
      socket.off('join:response', handleResponse);
    };
  }, [socket, requestId, navigate]);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    mutate(inviteCode, {
      onSuccess: (data) => {
        setRequestId(data.requestId);
        setJoinStatus('pending');
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const renderUserContent = () => {
    if (joinStatus === 'pending') {
      return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
          <div>
            <p className="font-semibold text-base">Waiting for approval</p>
            <p className="text-sm text-muted-foreground mt-1">
              A workspace owner or admin will review your request shortly.
            </p>
          </div>
        </div>
      );
    }

    if (joinStatus === 'approved') {
      return (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Loader className="w-8 h-8 animate-spin text-green-500" />
          <p className="text-sm text-muted-foreground">Redirecting you to the workspace…</p>
        </div>
      );
    }

    if (joinStatus === 'denied') {
      return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <XCircle className="w-12 h-12 text-destructive" />
          <div>
            <p className="font-semibold text-base">Request denied</p>
            <p className="text-sm text-muted-foreground mt-1">
              The workspace owner has declined your request to join.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setJoinStatus('idle')}>
            Try again
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center my-3">
        <form onSubmit={handleSubmit}>
          <Button
            type="submit"
            disabled={isLoading}
            className="!bg-green-500 !text-white text-[23px] !h-auto"
          >
            {isLoading && <Loader className="!w-6 !h-6 animate-spin" />}
            Request to Join
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          Orbiit
        </Link>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                Hey there! You're invited to join an Orbiit Workspace!
              </CardTitle>
              <CardDescription>
                {user
                  ? 'Send a join request — the workspace owner or admin will approve it.'
                  : 'Looks like you need to be logged into your Orbiit account to join this Workspace.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Loader className="!w-11 !h-11 animate-spin place-self-center flex" />
              ) : (
                <div>
                  {user ? (
                    renderUserContent()
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <Link
                        className="flex-1 text-base"
                        to={`/sign-up?returnUrl=${returnUrl}`}
                      >
                        <Button className="w-full">Signup</Button>
                      </Link>
                      <Link className="flex-1 text-base" to={`/?returnUrl=${returnUrl}`}>
                        <Button variant="secondary" className="w-full border">
                          Login
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InviteUser;

