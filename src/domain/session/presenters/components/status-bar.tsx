import { Text, Box } from "ink";
import { separatorWidth } from "../formatters/table-formatter.js";

interface StatusBarProps {
  start: number;
  end: number;
  total: number;
}

export function StatusBar({ start, end, total }: StatusBarProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>{"─".repeat(separatorWidth())}</Text>
      {total > 0 && (
        <Text dimColor>
          {"  "}Showing {start}–{end} of {total} sessions
        </Text>
      )}
      <Box paddingTop={1}>
        <Text dimColor>{"  "}github.com/vineethkrishnan/claude-sessions</Text>
      </Box>
    </Box>
  );
}
