import { useState, useCallback } from "react";
import { Notification } from "./types";

let _nextId = 0;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /** Show a success toast. Auto-dismisses after `duration` ms (default 3 s). */
  const success = useCallback((message: string, duration = 3000) => {
    const id = ++_nextId;
    setNotifications((prev) => [...prev, { id, kind: "success", message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  /** Show an error toast. Auto-dismisses after `duration` ms (default 5 s). */
  const error = useCallback((message: string, duration = 5000) => {
    const id = ++_nextId;
    setNotifications((prev) => [...prev, { id, kind: "error", message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  /**
   * Show a confirmation.
   * Stays visible until the user responds.
   * `onConfirm` is called when they click "Sync now".
   * `onDismiss` is called when they click "Keep local".
   */
  const confirmation = useCallback((
    message: string,
    danger: "confirm" | "dismiss",
    onConfirm: () => void,
    confirmText?: string,
    onDismiss?: () => void,
    dismissText?: string,
    duration = 10000,
  ) => {
    const id = ++_nextId;
    setNotifications((prev) => [
      ...prev,
      {
        id,
        message,
        kind: "confirmation",
        danger,
        onConfirm: () => { dismiss(id); onConfirm(); },
        confirmText,
        onDismiss: () => { dismiss(id); onDismiss?.(); },
        dismissText,
      }
    ]); 
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return { notifications, dismiss, success, error, confirmation };
}

export type NotificationService = ReturnType<typeof useNotifications>;
