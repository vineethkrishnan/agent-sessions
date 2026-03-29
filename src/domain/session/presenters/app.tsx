import React, { useState, useEffect } from "react";
import { Box, useInput } from "ink";
import type { SessionModule } from "../session.module.js";
import { SplashScreen } from "./components/splash-screen.js";
import { SessionTable } from "./components/session-table.js";
import { SessionPreview } from "./components/session-preview.js";
import { AgentSelector } from "./components/agent-selector.js";
import { useSessions } from "./hooks/use-sessions.js";

export interface CliOptions {
  fzf: boolean;
  delete: boolean;
  noSplash: boolean;
  agent?: string;
}

interface AppProps {
  module: SessionModule;
  options: CliOptions;
  version: string;
}

export function App({ module, options, version }: AppProps) {
  const [isAgentSelectorVisible, setAgentSelectorVisible] = useState(!options.agent);
  const [isSplashVisible, setSplashVisible] = useState(!options.noSplash && !options.agent);

  const {
    filtered,
    filter,
    setFilter,
    deleteSession,
    resumeSession,
    openPreview,
    closePreview,
    previewSession,
    previewDetail,
    isLoaded,
    totalCount,
    activeProvider,
    providers,
    switchProvider,
  } = useSessions({
    listUseCase: module.listSessionsUseCase,
    deleteUseCase: module.deleteSessionUseCase,
    resumeUseCase: module.resumeSessionUseCase,
    getDetailUseCase: module.getSessionDetailUseCase,
    repository: module.multiAgentRepository,
  });

  useEffect(() => {
    if (options.agent) {
      try {
        switchProvider(options.agent);
      } catch {
        console.error(`Unknown agent: ${options.agent}`);
      }
    }
  }, [options.agent, switchProvider]);

  // Hide splash as soon as data is loaded or if it's disabled
  useEffect(() => {
    if (isLoaded) {
      setSplashVisible(false);
    }
  }, [isLoaded]);

  useInput((input, key) => {
    if (input === "a" && !previewSession) {
      setAgentSelectorVisible(true);
    }
    if (key.escape && isAgentSelectorVisible && activeProvider) {
      setAgentSelectorVisible(false);
    }
  });

  const handleAgentSelect = (providerId: string | null) => {
    switchProvider(providerId);
    setAgentSelectorVisible(false);
  };

  if (isSplashVisible) {
    return <SplashScreen version={version} loading={false} />;
  }

  if (isAgentSelectorVisible) {
    return (
      <AgentSelector
        providers={providers}
        activeProviderId={activeProvider?.id}
        onSelect={handleAgentSelect}
      />
    );
  }

  if (!isLoaded) {
    return <SplashScreen version={version} loading={true} />;
  }

  if (previewSession && previewDetail) {
    return (
      <Box flexDirection="column">
        <SessionPreview
          session={previewSession}
          detail={previewDetail}
          onClose={closePreview}
          onResume={() => resumeSession(previewSession)}
        />
      </Box>
    );
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
        onPreview={openPreview}
      />
    </Box>
  );
}
