import GraphApp from "./components/GraphApp";
import Notifications from "./components/Notifications";
import { useNotifications } from "./lib/useNotifications";

export default function App() {
  const notify = useNotifications();

  return <>
    <GraphApp notify={notify} />
    <Notifications dismiss={notify.dismiss} notifications={notify.notifications} />
  </>;
}
