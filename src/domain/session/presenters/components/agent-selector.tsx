import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface AgentProviderInfo {
  id: string;
  name: string;
}

interface AgentSelectorProps {
  providers: AgentProviderInfo[];
  activeProviderId: string | undefined;
  onSelect: (providerId: string | null) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  providers,
  activeProviderId,
  onSelect,
}) => {
  const options = [{ id: "all", name: "All Agents" }, ...providers];

  const initialIndex = options.findIndex((option) => option.id === (activeProviderId || "all"));
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    }
    if (key.return) {
      const selected = options[selectedIndex]!;
      onSelect(selected.id === "all" ? null : selected.id);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} marginY={1}>
      <Text bold color="cyan">
        Select AI Agent:
      </Text>
      {options.map((option, index) => (
        <Box key={option.id}>
          <Text color={index === selectedIndex ? "yellow" : "white"}>
            {index === selectedIndex ? "❯ " : "  "}
            {option.name}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>Use ↑/↓ to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
};
