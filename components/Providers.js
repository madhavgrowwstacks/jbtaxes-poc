"use client";
import { StoreProvider } from "./store";
import { ToastProvider } from "./ui/Toast";

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <StoreProvider>{children}</StoreProvider>
    </ToastProvider>
  );
}
