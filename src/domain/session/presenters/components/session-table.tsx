import React, { useState } from "react";
import { Text, Box, useInput, useApp } from "ink";
import type { Session } from "../../domain/session.model.js";
import {
  COLUMNS,
  truncate,
  padRight,
  formatDate,
  separatorWidth,
} from "../formatters/table-formatter.js";
import { DeleteConfirm } from "./delete-confirm.js";
import { StatusBar } from "./status-bar.js";

interface SessionTableProps {
  sessions: Session[];
  totalCount: number;
  filter: string;
  isDeleteMode: boolean;
  onSetFilter: (filter: string) => void;
  onDelete: (session: Session) => void;
  onResume: (session: Session) => void;
}

export function SessionTable({
  sessions,
  totalCount,
  filter,
  isDeleteMode,
  onSetFilter,
  onDelete,
  onResume,
}: SessionTableProps) {
  const { exit } = useApp();
  const [selected, setSelected] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);

  const maxVisible = Math.max((process.stdout.rows || 24) - 10, 5);
  const clampedSelected = Math.min(selected, Math.max(sessions.length - 1, 0));
  const scrollOffset = Math.max(0, clampedSelected - maxVisible + 1);
  const visibleSessions = sessions.slice(scrollOffset, scrollOffset + maxVisible);
  const showEnd = Math.min(scrollOffset + maxVisible, sessions.length);

  useInput((input, key) => {
    if (deleteTarget) return;

    // Search mode
    if (isSearchMode) {
      if (key.escape) {
        setIsSearchMode(false);
        onSetFilter("");
        setSelected(0);
      } else if (key.return) {
        setIsSearchMode(false);
      } else if (key.backspace || key.delete) {
        onSetFilter(filter.slice(0, -1));
        setSelected(0);
      } else if (input && !key.ctrl && !key.meta) {
        onSetFilter(filter + input);
        setSelected(0);
      }
      return;
    }

    // Navigation mode
    if (key.upArrow) {
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (key.downArrow) {
      setSelected((prev) => Math.min(prev + 1, sessions.length - 1));
    } else if (key.pageUp) {
      setSelected((prev) => Math.max(prev - 10, 0));
    } else if (key.pageDown) {
      setSelected((prev) => Math.min(prev + 10, sessions.length - 1));
    } else if (key.escape && filter) {
      onSetFilter("");
      setSelected(0);
    } else if (input === "/" && !key.ctrl) {
      setIsSearchMode(true);
    } else if (input === "d" && !key.ctrl && sessions.length > 0) {
      setDeleteTarget(sessions[clampedSelected]!);
    } else if (input === "q" || input === "Q") {
      exit();
    } else if (key.return && sessions.length > 0) {
      onResume(sessions[clampedSelected]!);
    }
  });

  if (deleteTarget) {
    return (
      <DeleteConfirm
        session={deleteTarget}
        onConfirm={() => {
          onDelete(deleteTarget);
          setDeleteTarget(null);
          setSelected((prev) => Math.min(prev, Math.max(sessions.length - 2, 0)));
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        {isDeleteMode && (
          <Text color="red" bold>
            [DELETE MODE]{" "}
          </Text>
        )}
        <Text bold>Claude Code — Resume Session</Text>
        <Text dimColor> ({totalCount} total)</Text>
      </Box>

      <Text dimColor>
        Arrow keys: navigate Enter: select /: search d: delete Esc: clear q: quit
      </Text>

      {isSearchMode && (
        <Box>
          <Text color="yellow">Filter: </Text>
          <Text>{filter}</Text>
          <Text dimColor> ({sessions.length} matches)</Text>
        </Box>
      )}
      {filter && !isSearchMode && (
        <Text dimColor>
          Filter: {filter} ({sessions.length} matches)
        </Text>
      )}

      <Text dimColor>{"─".repeat(separatorWidth())}</Text>
      <Text dimColor>
        {"  "}
        {padRight("Date", COLUMNS.date)} │ {padRight("Project", COLUMNS.project)} │{" "}
        {padRight("Branch", COLUMNS.branch)} │ {padRight("Msgs", COLUMNS.msgs)} │ First Message
      </Text>
      <Text dimColor>{"─".repeat(separatorWidth())}</Text>

      {sessions.length === 0 ? (
        <Text> No matching sessions.</Text>
      ) : (
        visibleSessions.map((session, i) => {
          const realIndex = scrollOffset + i;
          const isSelected = realIndex === clampedSelected;
          const color = isSelected ? (isDeleteMode ? "red" : "green") : undefined;

          const line = `${padRight(formatDate(session.modifiedAt), COLUMNS.date)} │ ${padRight(truncate(session.project, COLUMNS.project), COLUMNS.project)} │ ${padRight(truncate(session.gitBranch, COLUMNS.branch), COLUMNS.branch)} │ ${padRight(String(session.messageCount), COLUMNS.msgs)} │ ${truncate(session.preview, COLUMNS.preview)}`;

          return (
            <Box key={session.id}>
              <Text color={color} bold={isSelected}>
                {isSelected ? "  ▶ " : "    "}
                {line}
              </Text>
            </Box>
          );
        })
      )}

      <StatusBar start={scrollOffset + 1} end={showEnd} total={sessions.length} />
    </Box>
  );
}
