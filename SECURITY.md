# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in agent-sessions, please report it responsibly.

**Do NOT open a public issue.**

Instead, please use [GitHub Security Advisories](https://github.com/vineethkrishnan/agent-sessions/security/advisories/new) to report the vulnerability privately.

You should receive an acknowledgement within 48 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Scope

The following are in scope for security reports:

- Command injection via CLI arguments or session metadata
- Path traversal in session file operations
- Arbitrary code execution when parsing JSONL session files
- Information disclosure from session data

## Out of Scope

- Vulnerabilities in third-party dependencies (report these upstream)
- Denial of service via resource exhaustion on the local system
- Issues requiring physical access to the host
