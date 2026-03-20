export interface ProcessLauncherPort {
  launch(command: string, args: string[]): void;
}
