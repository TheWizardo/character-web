import GraphApp from "./components/GraphApp";
import Notifications from "./components/Notifications";
import { NotificationsProvider } from "./components/NotificationsProvider";
import { useOfficialSite } from "./hooks/useOfficialSite";

export default function App() {
  useOfficialSite();
  return <>
    <NotificationsProvider>
      <GraphApp />
      <Notifications />
    </NotificationsProvider>
  </>;
}
