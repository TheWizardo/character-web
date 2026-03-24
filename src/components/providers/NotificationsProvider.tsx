import React, { useCallback, useMemo, useRef, useState } from "react";
import { Notification } from "../../lib/types";
import { NotificationsContext, NotificationService } from "../../hooks/useNotifications";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = () => notifications.forEach(n => dismiss(n.id));

  const success = useCallback((message: string, duration = 3000) => {
    const id = ++nextIdRef.current;
    setNotifications((prev) => [...prev, { id, kind: "success", message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const error = useCallback((message: string, duration = 5000) => {
    const id = ++nextIdRef.current;
    setNotifications((prev) => [...prev, { id, kind: "error", message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const confirmation = useCallback((
    message: string,
    danger: "confirm" | "dismiss",
    onConfirm: () => void,
    confirmText?: string,
    onDismiss?: () => void,
    dismissText?: string,
    duration = 10000,
  ) => {
    const id = ++nextIdRef.current;
    setNotifications((prev) => [
      ...prev,
      {
        id,
        message,
        kind: "confirmation",
        danger,
        onConfirm: () => {
          dismiss(id);
          onConfirm();
        },
        confirmText,
        onDismiss: () => {
          dismiss(id);
          onDismiss?.();
        },
        dismissText,
      },
    ]);

    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value = useMemo<NotificationService>(() => ({
    notifications,
    dismiss,
    dismissAll,
    success,
    error,
    confirmation,
  }), [notifications, dismiss, dismissAll, success, error, confirmation]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}