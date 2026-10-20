"use client";

import { createContext, useContext } from "react";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ value, children }) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceSession() {
  const workspace = useContext(WorkspaceContext);

  if (!workspace) {
    throw new Error("useWorkspaceSession must be used within WorkspaceProvider.");
  }

  return workspace;
}
