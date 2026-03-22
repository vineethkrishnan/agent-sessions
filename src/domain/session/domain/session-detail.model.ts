export interface SessionMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

interface SessionDetailParams {
  readonly messages: SessionMessage[];
  readonly totalMessages: number;
  readonly cwd: string;
  readonly gitBranch: string;
}

export class SessionDetail {
  readonly messages: SessionMessage[];
  readonly totalMessages: number;
  readonly cwd: string;
  readonly gitBranch: string;

  constructor(params: SessionDetailParams) {
    this.messages = params.messages;
    this.totalMessages = params.totalMessages;
    this.cwd = params.cwd;
    this.gitBranch = params.gitBranch;
  }

  get loadedMessages(): number {
    return this.messages.length;
  }

  get hasMore(): boolean {
    return this.totalMessages > this.loadedMessages;
  }
}
