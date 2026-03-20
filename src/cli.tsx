#!/usr/bin/env node

import { Command } from "commander";
import { render } from "ink";
import React from "react";
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
  .name("claude-sessions")
  .description(
    "Interactive session manager for Claude Code — browse, search, delete, and resume past conversations",
  )
  .version(pkg.version, "-v, --version")
  .option("--fzf", "Use fzf for selection (requires fzf)", false)
  .option("--delete", "Enable delete mode", false)
  .option("--no-splash", "Skip the splash screen")
  .parse();

const opts = program.opts<{ fzf: boolean; delete: boolean; splash: boolean }>();

const options: CliOptions = {
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

function runFzfMode(): void {
  const sessions = sessionModule.listSessionsUseCase.execute();

  if (sessions.length === 0) {
    console.error("No sessions found.");
    process.exit(1);
  }

  const lines = sessions.map((s) => {
    const date = padRight(formatDate(s.modifiedAt), 16);
    const project = padRight(truncate(s.project, 28), 28);
    const branch = padRight(truncate(s.gitBranch, 20), 20);
    const msgs = padRight(String(s.messageCount), 5);
    const preview = truncate(s.preview, 60);
    return `${s.id}\t${date} │ ${project} │ ${branch} │ ${msgs} │ ${preview}`;
  });

  const header = `${"".padEnd(37)}${padRight("Date", 16)} │ ${padRight("Project", 28)} │ ${padRight("Branch", 20)} │ ${padRight("Msgs", 5)} │ First Message`;

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
  fzf.stdout?.on("data", (data: Buffer) => {
    output += data.toString();
  });

  fzf.on("close", (code) => {
    if (code !== 0 || !output.trim()) process.exit(0);

    const sessionId = output.trim().split("\t")[0];
    if (sessionId) {
      console.log(`Resuming session: ${sessionId}`);
      sessionModule.resumeSessionUseCase.execute(sessionId);
    }
  });
}
