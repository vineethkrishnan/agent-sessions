import React, { useState, useEffect, useCallback } from "react";
import { Box, useInput, useApp } from "ink";
import type { SessionModule } from "../session.module.js";
import type { Session } from "../domain/session.model.js";
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

export interface ResumeRequest {
  sessionId: string;
  providerName: string;
  cwd: string;
}

interface AppProps {
  module: SessionModule;
  options: CliOptions;
  version: string;
  onResume?: (request: ResumeRequest) => void;
}

export function App({ module, options, version, onResume }: AppProps) {
  const { exit } = useApp();
  const [isAgentSelectorVisible, setAgentSelectorVisible] = useState(!options.agent);
  const [isSplashVisible, setSplashVisible] = useState(!options.noSplash && !options.agent);

  const handleResume = useCallback(
    (session: Session) => {
      if (onResume) {
        onResume({ sessionId: session.id, providerName: session.provider, cwd: session.cwd });
        exit();
      }
    },
    [onResume, exit],
  );

  const {
    filtered,
    filter,
    setFilter,
    deleteSession,
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

  if (isAgentSelectorVisible) {
    return (
      <AgentSelector
        providers={providers}
        activeProviderId={activeProvider?.id}
        onSelect={handleAgentSelect}
      />
    );
  }

  if (isSplashVisible || !isLoaded) {
    return <SplashScreen version={version} loading={!isSplashVisible} />;
  }

  if (previewSession && previewDetail) {
    return (
      <Box flexDirection="column">
        <SessionPreview
          session={previewSession}
          detail={previewDetail}
          onClose={closePreview}
          onResume={() => handleResume(previewSession)}
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
        onResume={handleResume}
        onPreview={openPreview}
      />
    </Box>
  );
}
