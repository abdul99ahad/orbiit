import AppRoutes from "./routes";
import { SocketProvider } from "./context/socket-provider";

function App() {
  return (
    <SocketProvider>
      <AppRoutes />
    </SocketProvider>
  );
}

export default App;
