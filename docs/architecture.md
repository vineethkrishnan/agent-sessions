# Architecture

claude-sessions follows a **vertical-slice hexagonal architecture** with clean separation of concerns.

## Layer Diagram

```
┌──────────────────────────────────────────────────┐
│  Presenters (Ink/React)                          │
│  ├── App, SessionTable, SessionPreview, Splash   │
│  ├── Hooks (useSessions)                         │
│  └── Formatters                                  │
├──────────────────────────────────────────────────┤
│  Application (Use Cases)                         │
│  ├── ListSessionsUseCase                         │
│  ├── GetSessionDetailUseCase                     │
│  ├── DeleteSessionUseCase                        │
│  └── ResumeSessionUseCase                        │
├──────────────────────────────────────────────────┤
│  Domain (Pure Business Logic)                    │
│  ├── Session entity                              │
│  ├── SessionDetail + SessionMessage              │
│  ├── Session errors                              │
│  └── matchesFilter logic                         │
├──────────────────────────────────────────────────┤
│  Infrastructure (Adapters)                       │
│  ├── FsSessionRepositoryAdapter                  │
│  ├── FsSessionStorageAdapter                     │
│  ├── CliProcessLauncherAdapter                   │
│  └── JSONL parser                                │
└──────────────────────────────────────────────────┘
```

## Dependency Flow

```
presenters → application → domain ← infrastructure
```

- **Domain** has zero external dependencies
- **Application** depends only on domain types and port interfaces
- **Infrastructure** implements port interfaces defined by the application layer
- **Presenters** consume use cases via the module wiring

## Directory Structure

```
src/
├── domain/session/              # Session domain module
│   ├── domain/                  # Pure business logic (zero deps)
│   │   ├── session.model.ts     # Session entity + filtering
│   │   ├── session-detail.model.ts  # Conversation detail model
│   │   └── session.error.ts     # Domain errors
│   ├── application/             # Use cases + ports
│   │   ├── ports/               # Interface contracts
│   │   ├── list-sessions.use-case.ts
│   │   ├── delete-session.use-case.ts
│   │   ├── resume-session.use-case.ts
│   │   └── get-session-detail.use-case.ts
│   ├── infrastructure/          # Adapters (fs, spawn)
│   │   ├── fs-session-repository.adapter.ts
│   │   ├── fs-session-storage.adapter.ts
│   │   ├── cli-process-launcher.adapter.ts
│   │   └── jsonl-parser.ts
│   ├── presenters/              # UI layer (Ink/React)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── formatters/
│   │   └── app.tsx
│   └── session.module.ts        # Module wiring (DI)
├── common/helpers/              # Cross-domain utilities
│   └── path.helper.ts
└── cli.tsx                      # Entry point
```

## Module Wiring

`session.module.ts` acts as a dependency injection container, wiring adapters to use cases:

```ts
export function createSessionModule(): SessionModule {
  const repository = new FsSessionRepositoryAdapter();
  const storage = new FsSessionStorageAdapter();
  const launcher = new CliProcessLauncherAdapter();

  return {
    listSessionsUseCase: new ListSessionsUseCase(repository),
    deleteSessionUseCase: new DeleteSessionUseCase(storage),
    resumeSessionUseCase: new ResumeSessionUseCase(launcher),
    getSessionDetailUseCase: new GetSessionDetailUseCase(repository),
  };
}
```

Tests are co-located with source files (`*.spec.ts`).
