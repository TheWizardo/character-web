import { useEffect } from "react";
import GraphApp from "./components/GraphApp";
import Notifications from "./components/Notifications";
import { AppStateProvider } from "./components/providers/AppStateProvider";
import { AuthProvider } from "./components/providers/AuthProvider";
import { NotificationsProvider } from "./components/providers/NotificationsProvider";
import { useOfficialSite } from "./hooks/useOfficialSite";

export default function App() {
  const { isValid, redirect } = useOfficialSite();

  useEffect(() => {
    if (!isValid) redirect();
  }, [])

  return <>
    <AuthProvider>
      <AppStateProvider>
        <NotificationsProvider>
          <GraphApp />
          <Notifications />
        </NotificationsProvider>
      </AppStateProvider>
    </AuthProvider>
  </>;
}
