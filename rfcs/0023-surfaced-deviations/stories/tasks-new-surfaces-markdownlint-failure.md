---
title: "tasks new hides markdownlint body failures behind a git commit stack trace"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while filing follow-ups during PR #4869.

`pnpm tasks new <rfc> <slug> --body-file <path>` runs the story body through a
markdownlint pre-commit hook. When the body violates a rule, the CLI dies with a
Node stack trace whose visible tail is:

```text
error: tasks CLI command failed
Error: Command failed: git -C .../tasks commit -q -m new: <rfc>/<slug>
    at genericNodeError (node:internal/errors:985:15)
```

The actual cause is printed far above, buried under `built index`, `validated`,
`markdownlint-cli2`, `Finding:` and `Linting:` noise, and the visible tail names
`git commit` — which reads exactly like the known push-contention flake. The
failure is deterministic, so the natural response (retry with backoff) never
succeeds. It cost ~12 wasted invocations across two retry loops before I piped
the output through `grep -v` to find the real message.

Two real rules hit in one sitting, both easy to trip in a story body written by
an agent:

- **MD018/no-missing-space-atx** — a paragraph that wraps so a PR reference
  lands at column 0 (`\n4869 (which fixed...` with a leading hash) reads as a
  malformed ATX heading.
- **MD040/fenced-code-language** — a fenced block without a language, e.g. a
  pasted `grep` invocation.

Both are legitimate lint rules; the bug is the surfacing, not the rules.

Related prior art: `cli-mutation-atomic-rollback-and-error-surfacing` and
`commitandpush-mutator-exit-leaks-lock`, both under the now-closed RFC
`0024-tasks-cli-coverage` — same class of problem, different mutator. Filed here
because 0024 is closed and takes no new stories; re-home it if a tasks-CLI RFC
is reopened.

## Acceptance criteria

- [ ] A markdownlint failure in `tasks new` / `tasks edit` exits with the
      offending `file:line rule` message as the last thing printed, not a
      `git commit` stack trace.
- [ ] The message distinguishes "your body is invalid" (deterministic, fix it)
      from "the push raced" (transient, retry) so a caller can tell whether a
      retry is worth attempting.
- [ ] Non-zero exit preserved; no partial/empty commit left behind (see
      `commitandpush-mutator-exit-leaks-lock`).
- [ ] Test covers at least one rule violation via `--body-file`.

## Notes

DX/tooling. Agent-facing: every loop worker filing a follow-up hits this path.
