import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SessionRepositoryPort } from "../application/ports/session-repository.port.js";
import { Session } from "../domain/session.model.js";
import { parseSessionFile } from "./jsonl-parser.js";
import { decodeProjectPath } from "../../../common/helpers/path.helper.js";

export class FsSessionRepositoryAdapter implements SessionRepositoryPort {
  private readonly sessionsDir: string;

  constructor(sessionsDir?: string) {
    this.sessionsDir = sessionsDir ?? path.join(os.homedir(), ".claude", "projects");
  }

  findAll(): Session[] {
    if (!fs.existsSync(this.sessionsDir)) return [];

    const results: { filePath: string; dirName: string; mtime: Date }[] = [];

    for (const dir of fs.readdirSync(this.sessionsDir, {
      withFileTypes: true,
    })) {
      if (!dir.isDirectory()) continue;

      const projectPath = path.join(this.sessionsDir, dir.name);
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(projectPath, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".jsonl")) continue;

        const filePath = path.join(projectPath, entry.name);
        try {
          const stat = fs.statSync(filePath);
          results.push({ filePath, dirName: dir.name, mtime: stat.mtime });
        } catch {
          continue;
        }
      }
    }

    results.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return results.map((file) => {
      const metadata = parseSessionFile(file.filePath);
      return new Session({
        id: path.basename(file.filePath, ".jsonl"),
        filePath: file.filePath,
        project: decodeProjectPath(file.dirName),
        gitBranch: metadata.gitBranch,
        messageCount: metadata.messageCount,
        preview: metadata.preview,
        modifiedAt: file.mtime,
        cwd: metadata.cwd,
      });
    });
  }
}
