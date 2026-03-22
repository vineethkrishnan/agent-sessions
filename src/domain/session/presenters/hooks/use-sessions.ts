import { useState, useEffect, useMemo, useCallback } from "react";
import type { Session } from "../../domain/session.model.js";
import type { SessionDetail } from "../../domain/session-detail.model.js";
import type { ListSessionsUseCase } from "../../application/list-sessions.use-case.js";
import type { DeleteSessionUseCase } from "../../application/delete-session.use-case.js";
import type { ResumeSessionUseCase } from "../../application/resume-session.use-case.js";
import type { GetSessionDetailUseCase } from "../../application/get-session-detail.use-case.js";

interface UseSessionsOptions {
  listUseCase: ListSessionsUseCase;
  deleteUseCase: DeleteSessionUseCase;
  resumeUseCase: ResumeSessionUseCase;
  getDetailUseCase: GetSessionDetailUseCase;
}

export function useSessions({
  listUseCase,
  deleteUseCase,
  resumeUseCase,
  getDetailUseCase,
}: UseSessionsOptions) {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [previewDetail, setPreviewDetail] = useState<SessionDetail | null>(null);

  useEffect(() => {
    const sessions = listUseCase.execute();
    setAllSessions(sessions);
    setIsLoaded(true);
  }, []);

  const filtered = useMemo(
    () => (filter ? allSessions.filter((s) => s.matchesFilter(filter)) : allSessions),
    [allSessions, filter],
  );

  const deleteSession = useCallback(
    (session: Session) => {
      deleteUseCase.execute(session);
      setAllSessions((prev) => prev.filter((s) => s.id !== session.id));
    },
    [deleteUseCase],
  );

  const resumeSession = useCallback(
    (session: Session) => {
      resumeUseCase.execute(session.id);
    },
    [resumeUseCase],
  );

  const openPreview = useCallback(
    (session: Session) => {
      const detail = getDetailUseCase.execute(session);
      setPreviewSession(session);
      setPreviewDetail(detail);
    },
    [getDetailUseCase],
  );

  const closePreview = useCallback(() => {
    setPreviewSession(null);
    setPreviewDetail(null);
  }, []);

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
  };
}
