import React, { useState, useEffect } from "react";
import { Box } from "ink";
import type { SessionModule } from "../session.module.js";
import { SplashScreen } from "./components/splash-screen.js";
import { SessionTable } from "./components/session-table.js";
import { useSessions } from "./hooks/use-sessions.js";

export interface CliOptions {
  fzf: boolean;
  delete: boolean;
  noSplash: boolean;
}

interface AppProps {
  module: SessionModule;
  options: CliOptions;
  version: string;
}

export function App({ module, options, version }: AppProps) {
  const { filtered, filter, setFilter, deleteSession, resumeSession, isLoaded, totalCount } =
    useSessions({
      listUseCase: module.listSessionsUseCase,
      deleteUseCase: module.deleteSessionUseCase,
      resumeUseCase: module.resumeSessionUseCase,
    });

  const [showSplash, setShowSplash] = useState(!options.noSplash);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => setShowSplash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (showSplash || !isLoaded) {
    return <SplashScreen version={version} loading={!isLoaded} />;
  }

  return (
    <Box flexDirection="column">
      <SessionTable
        sessions={filtered}
        totalCount={totalCount}
        filter={filter}
        isDeleteMode={options.delete}
        onSetFilter={setFilter}
        onDelete={deleteSession}
        onResume={resumeSession}
      />
    </Box>
  );
}
