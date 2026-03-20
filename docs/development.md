# Development

## Setup

```bash
git clone https://github.com/vineethkrishnan/claude-sessions.git
cd claude-sessions
npm install
npm run build
```

## Run Locally

```bash
node dist/cli.js
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Watch mode (recompile on change) |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run lint:strict` | Lint with zero warnings |
| `npm run lint:dead-code` | Detect dead code (knip) |
| `npm run lint:duplicates` | Detect code duplication (jscpd) |
| `npm run analyze` | Run all quality checks |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run docs:dev` | Start docs dev server |
| `npm run docs:build` | Build docs for production |
| `npm run docs:preview` | Preview built docs |

## Testing

Tests use [Vitest](https://vitest.dev/) and are co-located with source files as `*.spec.ts`.

```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:cov      # With coverage report
```

## Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(session): add fuzzy search filtering
fix(parser): handle array content format in JSONL
chore: update dependencies
```

Pre-commit hooks run Prettier and ESLint via Husky + lint-staged.

## CI/CD

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **CI** | Push/PR to main | Lint, test (with coverage), build |
| **Commit Lint** | PR | Validates PR title follows Conventional Commits |
| **Code Quality** | Push/PR to main | Dead code, duplication, strict types |
| **Security** | Push/PR/weekly | CodeQL, dependency review, Trivy |
| **Release** | Push to main | release-please, npm publish, docs deploy |
