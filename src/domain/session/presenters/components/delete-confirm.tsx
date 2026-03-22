import { Text, Box, useInput } from "ink";
import type { Session } from "../../domain/session.model.js";
import { formatDate } from "../formatters/table-formatter.js";

interface DeleteConfirmProps {
  session: Session;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ session, onConfirm, onCancel }: DeleteConfirmProps) {
  useInput((input, key) => {
    if (input === "y" || input === "Y") onConfirm();
    else if (input === "n" || input === "N" || key.escape) onCancel();
  });

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text color="red" bold>
        Delete this session?
      </Text>
      <Box paddingTop={1} paddingLeft={2} flexDirection="column">
        <Text>
          Session: <Text bold>{session.id}</Text>
        </Text>
        <Text>
          Project: <Text bold>{session.project}</Text>
        </Text>
        <Text>
          Branch: <Text bold>{session.gitBranch}</Text>
        </Text>
        <Text>
          Date: <Text bold>{formatDate(session.modifiedAt)}</Text>
        </Text>
        <Text>
          Preview: <Text bold>{session.preview}</Text>
        </Text>
      </Box>
      <Box paddingTop={1}>
        <Text>
          Press{" "}
          <Text color="red" bold>
            y
          </Text>{" "}
          to confirm, <Text bold>n</Text> to cancel
        </Text>
      </Box>
    </Box>
  );
}
