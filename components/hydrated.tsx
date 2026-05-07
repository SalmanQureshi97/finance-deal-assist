"use client";

import * as React from "react";

const noopSubscribe = () => () => {};

export function Hydrated({ children }: { children: React.ReactNode }) {
  const ready = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!ready) return null;
  return <>{children}</>;
}
