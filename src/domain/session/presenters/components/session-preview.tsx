import { useState, useMemo } from "react";
import { Text, Box, useInput } from "ink";
import type { Session } from "../../domain/session.model.js";
import type { SessionDetail } from "../../domain/session-detail.model.js";
import { formatDate, separatorWidth } from "../formatters/table-formatter.js";

interface SessionPreviewProps {
  session: Session;
  detail: SessionDetail;
  onClose: () => void;
  onResume: () => void;
}

const MAX_MESSAGE_LINES = 8;

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine.length <= width) {
      lines.push(rawLine);
    } else {
      let remaining = rawLine;
      while (remaining.length > width) {
        let breakAt = remaining.lastIndexOf(" ", width);
        if (breakAt <= 0) breakAt = width;
        lines.push(remaining.slice(0, breakAt));
        remaining = remaining.slice(breakAt).trimStart();
      }
      if (remaining) lines.push(remaining);
    }
  }
  return lines;
}

function formatMessageContent(content: string, width: number, maxLines: number): string[] {
  const cleaned = content.replace(/\s+/g, " ").trim();
  const wrapped = wrapText(cleaned, width);

  if (wrapped.length <= maxLines) return wrapped;
  return [...wrapped.slice(0, maxLines - 1), "…"];
}

export function SessionPreview({ session, detail, onClose, onResume }: SessionPreviewProps) {
  const maxVisible = Math.max((process.stdout.rows || 24) - 12, 8);
  const contentWidth = Math.min((process.stdout.columns || 80) - 8, 100);

  const renderedMessages = useMemo(() => {
    return detail.messages.map((msg) => ({
      role: msg.role,
      lines: formatMessageContent(msg.content, contentWidth, MAX_MESSAGE_LINES),
    }));
  }, [detail.messages, contentWidth]);

  const totalContentLines = renderedMessages.reduce((sum, m) => sum + m.lines.length + 2, 0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const maxScroll = Math.max(0, totalContentLines - maxVisible);

  useInput((input, key) => {
    if (key.escape || input === "p") {
      onClose();
    } else if (key.return) {
      onResume();
    } else if (key.downArrow) {
      setScrollOffset((prev) => Math.min(prev + 1, maxScroll));
    } else if (key.upArrow) {
      setScrollOffset((prev) => Math.max(prev - 1, 0));
    } else if (key.pageDown) {
      setScrollOffset((prev) => Math.min(prev + 10, maxScroll));
    } else if (key.pageUp) {
      setScrollOffset((prev) => Math.max(prev - 10, 0));
    } else if (input === "q" || input === "Q") {
      onClose();
    }
  });

  const allLines: { role: string; text: string; isLabel: boolean }[] = [];
  for (const msg of renderedMessages) {
    allLines.push({ role: msg.role, text: "", isLabel: true });
    for (const line of msg.lines) {
      allLines.push({ role: msg.role, text: line, isLabel: false });
    }
    allLines.push({ role: "", text: "", isLabel: false });
  }

  const visibleLines = allLines.slice(scrollOffset, scrollOffset + maxVisible);
  const sep = "─".repeat(separatorWidth());

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Session Preview
      </Text>
      <Text dimColor>{sep}</Text>

      {/* Session metadata header */}
      <Box flexDirection="column" paddingLeft={1}>
        <Text>
          <Text dimColor>Session: </Text>
          <Text bold>{session.id}</Text>
        </Text>
        <Text>
          <Text dimColor>Project: </Text>
          <Text bold>{session.project}</Text>
        </Text>
        <Box>
          <Text>
            <Text dimColor>Branch: </Text>
            <Text>{session.gitBranch || "(none)"}</Text>
          </Text>
          <Text>
            {"    "}
            <Text dimColor>Date: </Text>
            <Text>{formatDate(session.modifiedAt)}</Text>
          </Text>
          <Text>
            {"    "}
            <Text dimColor>Messages: </Text>
            <Text>{detail.totalMessages}</Text>
          </Text>
        </Box>
        {session.cwd && (
          <Text>
            <Text dimColor>Working dir: </Text>
            <Text>{session.cwd}</Text>
          </Text>
        )}
      </Box>

      <Text dimColor>{sep}</Text>

      {/* Conversation messages */}
      <Box flexDirection="column" paddingLeft={1}>
        {visibleLines.map((line, i) => {
          if (line.isLabel) {
            const color = line.role === "user" ? "green" : "magenta";
            const label = line.role === "user" ? "You" : "Claude";
            return (
              <Text key={i} color={color} bold>
                {label}:
              </Text>
            );
          }
          if (!line.text && !line.role) {
            return <Text key={i}> </Text>;
          }
          return (
            <Text key={i} wrap="truncate">
              {"  "}
              {line.text}
            </Text>
          );
        })}
      </Box>

      {detail.hasMore && (
        <Text dimColor italic>
          {"  "}Showing {detail.loadedMessages} of {detail.totalMessages} messages
        </Text>
      )}

      <Text dimColor>{sep}</Text>
      <Text dimColor>{"  "}Enter: resume p/Esc: back Up/Down: scroll q: quit</Text>
    </Box>
  );
}
