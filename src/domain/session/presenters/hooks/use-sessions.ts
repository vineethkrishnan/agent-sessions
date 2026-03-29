import { useState, useEffect, useMemo, useCallback } from "react";
import type { Session } from "../../domain/session.model.js";
import type { SessionDetail } from "../../domain/session-detail.model.js";
import type { ListSessionsUseCase } from "../../application/use-cases/list-sessions.use-case.js";
import type { DeleteSessionUseCase } from "../../application/use-cases/delete-session.use-case.js";
import type { ResumeSessionUseCase } from "../../application/use-cases/resume-session.use-case.js";
import type { GetSessionDetailUseCase } from "../../application/use-cases/get-session-detail.use-case.js";
import type { ProviderManagementPort } from "../../application/ports/provider-management.port.js";

interface UseSessionsOptions {
  listUseCase: ListSessionsUseCase;
  deleteUseCase: DeleteSessionUseCase;
  resumeUseCase: ResumeSessionUseCase;
  getDetailUseCase: GetSessionDetailUseCase;
  repository: ProviderManagementPort;
}

export function useSessions({
  listUseCase,
  deleteUseCase,
  resumeUseCase,
  getDetailUseCase,
  repository,
}: UseSessionsOptions) {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [previewDetail, setPreviewDetail] = useState<SessionDetail | null>(null);
  const [activeProvider, setActiveProvider] = useState<{ id: string; name: string } | null>(
    repository.getActiveProvider(),
  );

  const refreshSessions = useCallback(async () => {
    setIsLoaded(false);
    try {
      const sessions = await listUseCase.execute();
      setAllSessions(sessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setAllSessions([]);
    } finally {
      setIsLoaded(true);
    }
  }, [listUseCase]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions, activeProvider]);

  const filtered = useMemo(
    () => (filter ? allSessions.filter((session) => session.matchesFilter(filter)) : allSessions),
    [allSessions, filter],
  );

  const deleteSession = useCallback(
    async (session: Session) => {
      try {
        await deleteUseCase.execute(session.filePath);
        setAllSessions((prev) => prev.filter((existing) => existing.id !== session.id));
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    },
    [deleteUseCase],
  );

  const resumeSession = useCallback(
    (session: Session) => {
      resumeUseCase.execute(session.id, session.provider);
    },
    [resumeUseCase],
  );

  const openPreview = useCallback(
    async (session: Session) => {
      try {
        const detail = await getDetailUseCase.execute(session.filePath, session.provider);
        setPreviewSession(session);
        setPreviewDetail(detail);
      } catch (error) {
        console.error("Failed to get session detail:", error);
      }
    },
    [getDetailUseCase],
  );

  const closePreview = useCallback(() => {
    setPreviewSession(null);
    setPreviewDetail(null);
  }, []);

  const switchProvider = useCallback(
    (providerId: string | null) => {
      repository.setActiveProvider(providerId);
      setActiveProvider(repository.getActiveProvider());
      setFilter("");
      setPreviewSession(null);
      setPreviewDetail(null);
    },
    [repository],
  );

  const providers = useMemo(() => repository.getProviders(), [repository]);

  return {
    allSessions,
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
    totalCount: allSessions.length,
    activeProvider,
    providers,
    switchProvider,
  };
}
