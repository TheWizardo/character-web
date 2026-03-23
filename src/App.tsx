import GraphApp from "./components/GraphApp";
import Notifications from "./components/Notifications";
import { NotificationsProvider } from "./components/NotificationsProvider";
import { useNotifications } from "./hooks/useNotifications";

export default function App() {
  return <>
    <NotificationsProvider>
      <GraphApp/>
      <Notifications/>
    </NotificationsProvider>
  </>;
}
