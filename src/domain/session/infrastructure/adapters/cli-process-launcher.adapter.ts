import { spawn } from "node:child_process";
import type { ProcessLauncherPort } from "../../application/ports/process-launcher.port.js";

export class CliProcessLauncherAdapter implements ProcessLauncherPort {
  launch(command: string, args: string[]): void {
    const child = spawn(command, args, {
      stdio: "inherit",
      detached: true,
    });

    child.unref();
    process.exit(0);
  }
}
