"use client";

import { useCallback, useEffect, useState } from "react";
import { clearSession, readSession, writeSession } from "../lib/session";

export function useSession() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const save = useCallback((nextSession) => {
    writeSession(nextSession);
    setSession(nextSession);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return { session, ready, save, signOut };
}
