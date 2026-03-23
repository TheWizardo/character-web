import { createContext, useContext } from "react";
import { Notification } from "../lib/types";

export type NotificationService = {
  notifications: Notification[];
  dismiss: (id: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  confirmation: (
    message: string,
    danger: "confirm" | "dismiss",
    onConfirm: () => void,
    confirmText?: string,
    onDismiss?: () => void,
    dismissText?: string,
    duration?: number,
  ) => void;
};

export const NotificationsContext = createContext<NotificationService | null>(null);

export function useNotifications(): NotificationService {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}