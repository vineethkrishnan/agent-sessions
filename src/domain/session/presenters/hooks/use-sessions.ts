import { useState, useEffect, useMemo, useCallback } from "react";
import type { Session } from "../../domain/session.model.js";
import type { ListSessionsUseCase } from "../../application/list-sessions.use-case.js";
import type { DeleteSessionUseCase } from "../../application/delete-session.use-case.js";
import type { ResumeSessionUseCase } from "../../application/resume-session.use-case.js";

interface UseSessionsOptions {
  listUseCase: ListSessionsUseCase;
  deleteUseCase: DeleteSessionUseCase;
  resumeUseCase: ResumeSessionUseCase;
}

export function useSessions({ listUseCase, deleteUseCase, resumeUseCase }: UseSessionsOptions) {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

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

  return {
    allSessions,
    filtered,
    filter,
    setFilter,
    deleteSession,
    resumeSession,
    isLoaded,
    totalCount: allSessions.length,
  };
}
