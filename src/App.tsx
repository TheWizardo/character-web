import { useAuth } from "./lib/useAuth";
import GraphApp from "./components/GraphApp";

export default function App() {
  const { user, status, signIn, logOut } = useAuth();
  return <GraphApp user={user} authStatus={status} onSignIn={signIn} onSignOut={logOut} />;
}
