#!/usr/bin/env node

import React from "react";
import { Command } from "commander";
import { render } from "ink";
import { createSessionModule } from "./domain/session/session.module.js";
import { App, type CliOptions } from "./domain/session/presenters/app.js";
import {
  formatDate,
  truncate,
  padRight,
} from "./domain/session/presenters/formatters/table-formatter.js";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command()
  .name("agent-sessions")
  .description(
    "Interactive session manager for CLI Agents (Claude, Gemini, etc.) — browse, search, delete, and resume past conversations",
  )
  .version(pkg.version, "-v, --version")
  .option("--agent <name>", "Specify the agent (claude, gemini, etc.)")
  .option("--fzf", "Use fzf for selection (requires fzf)", false)
  .option("--delete", "Enable delete mode", false)
  .option("--no-splash", "Skip the splash screen")
  .parse();

const opts = program.opts<{ agent?: string; fzf: boolean; delete: boolean; splash: boolean }>();

const options: CliOptions = {
  agent: opts.agent,
  fzf: opts.fzf,
  delete: opts.delete,
  noSplash: !opts.splash,
};

const sessionModule = createSessionModule();

if (options.fzf) {
  runFzfMode();
} else {
  render(<App module={sessionModule} options={options} version={pkg.version} />);
}

async function runFzfMode(): Promise<void> {
  if (options.agent) {
    sessionModule.multiAgentRepository.setActiveProvider(options.agent);
  }

  const sessions = await sessionModule.listSessionsUseCase.execute();

  if (sessions.length === 0) {
    const agentName =
      sessionModule.multiAgentRepository.getActiveProvider()?.name || "active agent";
    console.error(`No sessions found for ${agentName}.`);
    process.exit(1);
  }

  const lines = sessions.map((session) => {
    const date = padRight(formatDate(session.modifiedAt), 16);
    const agent = padRight(truncate(session.provider, 8), 8);
    const project = padRight(truncate(session.project, 24), 24);
    const branch = padRight(truncate(session.gitBranch, 16), 16);
    const messageCount = padRight(String(session.messageCount), 5);
    const preview = truncate(session.preview, 60);
    return `${session.id}::${session.provider}\t${date} │ ${agent} │ ${project} │ ${branch} │ ${messageCount} │ ${preview}`;
  });

  const header = `        ${padRight("Date", 16)} │ ${padRight("Agent", 8)} │ ${padRight("Project", 24)} │ ${padRight("Branch", 16)} │ ${padRight("Msgs", 5)} │ First Message`;

  const fzf = spawn(
    "fzf",
    ["--header", header, "--reverse", "--no-sort", "--with-nth", "2..", "--delimiter", "\t"],
    {
      stdio: ["pipe", "pipe", "inherit"],
    },
  );

  fzf.stdin?.write(lines.join("\n"));
  fzf.stdin?.end();

  let output = "";
  fzf.stdout?.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });

  fzf.on("close", (code) => {
    if (code !== 0 || !output.trim()) process.exit(0);

    const selection = output.trim().split("\t")[0];
    if (selection) {
      const separatorIndex = selection.indexOf("::");
      if (separatorIndex === -1) return;
      const sessionId = selection.slice(0, separatorIndex);
      const providerName = selection.slice(separatorIndex + 2);
      if (sessionId && providerName) {
        console.log(`Resuming ${providerName} session: ${sessionId}`);
        sessionModule.resumeSessionUseCase.execute(sessionId, providerName);
      }
    }
  });
}
