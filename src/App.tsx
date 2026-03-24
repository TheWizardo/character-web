import GraphApp from "./components/GraphApp";
import Notifications from "./components/Notifications";
import { AppStateProvider } from "./components/providers/AppStateProvider";
import { NotificationsProvider } from "./components/providers/NotificationsProvider";
import { useOfficialSite } from "./hooks/useOfficialSite";

export default function App() {
  useOfficialSite();
  return <>
    <AppStateProvider>
      <NotificationsProvider>
        <GraphApp />
        <Notifications />
      </NotificationsProvider>
    </AppStateProvider>
  </>;
}
