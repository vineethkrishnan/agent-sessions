export interface SessionParams {
  readonly id: string;
  readonly filePath: string;
  readonly project: string;
  readonly gitBranch: string;
  readonly messageCount: number;
  readonly preview: string;
  readonly modifiedAt: Date;
  readonly cwd: string;
  readonly provider: string;
}

export class Session {
  readonly id: string;
  readonly filePath: string;
  readonly project: string;
  readonly gitBranch: string;
  readonly messageCount: number;
  readonly preview: string;
  readonly modifiedAt: Date;
  readonly cwd: string;
  readonly provider: string;

  constructor(params: SessionParams) {
    this.id = params.id;
    this.filePath = params.filePath;
    this.project = params.project;
    this.gitBranch = params.gitBranch;
    this.messageCount = params.messageCount;
    this.preview = params.preview;
    this.modifiedAt = params.modifiedAt;
    this.cwd = params.cwd;
    this.provider = params.provider;
  }

  matchesFilter(query: string): boolean {
    if (!query) return true;
    const lower = query.toLowerCase();
    const searchable =
      `${this.provider} ${this.project} ${this.gitBranch} ${this.preview} ${this.cwd}`.toLowerCase();
    return searchable.includes(lower);
  }
}
