---
title: "tasks CLI: authoring ergonomics — new --status/--body-file, standalone reindex + fmt"
status: in-progress
updated: 2026-06-13
rfc: "0001-task-system"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: 30
pr: 3172
claim: "2026-06-13T01:32:05Z"
assignee: "cli-authoring-ergonomics"
blocked-by: null
---

## Context

Authoring friction surfaced while filing several stories in one session.

- **Create-then-Write round-trip.** `new` emits a skeleton with a placeholder
  title and empty body, so every real story needs a follow-up file write. Let
  `new` accept `--status <v>` and `--body-file <path>` (and honor `--title`
  consistently) so a story can be created complete in one call.
- **No standalone reindex.** The index only rebuilds as a side effect of a
  mutating verb, so to refresh it after a manual edit you must abuse
  `priority <id> N` then `--clear`. Add `pnpm tasks reindex` (alias `build`).
- **No formatter hook.** The pre-commit prettier check rejects hand-authored
  markdown (wrapping/line length), forcing a manual `npx prettier --write`
  before commit. Add `pnpm tasks fmt` (or have `new`/the body-file path run
  prettier on the generated file) so authored stories are commit-clean.

These are independent; ship whichever fit under one ~500-LOC PR and register the
rest as follow-on stories rather than fanning out PRs.

## Acceptance criteria

- [ ] `new` can create a complete story in one call (`--status`, `--body-file`,
      `--title`)
- [ ] `pnpm tasks reindex`/`build` rebuilds the index without a no-op mutation
- [ ] A formatter path leaves authored stories prettier-clean before commit
