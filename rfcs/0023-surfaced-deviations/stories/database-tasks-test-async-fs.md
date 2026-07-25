---
title: "database-tasks.test: convert sync node:fs temp-dir usage to the async fs surface"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/tasks/database-tasks.test.ts` imports `node:fs`,
`node:os`, `node:path` and uses synchronous fs calls throughout
(`fs.mkdtempSync`, `fs.existsSync`, `fs.rmSync`, `fs.writeFileSync`) — roughly
a dozen sites across 8 tests. The repo's standing rules for this package are
no `node:*` imports, no `process.*`, and async fs only.

PR #5288 added four more temp-DB sites in this file and followed the existing
sync idiom deliberately, rather than introducing a second, inconsistent style
in four hunks of an otherwise uniformly-sync file. That call was flagged in the
PR body. The file-wide conversion is the real fix and wants its own story.

Note the file also references `process.env` extensively (SCHEMA, VERSION,
VERBOSE, SCOPE, SKIP_TEST_DATABASE, DISABLE_DATABASE_ENVIRONMENT_CHECK) to
mirror Rails' `ENV[...]` manipulation; whether that is in scope here or needs
an env-adapter of its own is a triage question for this story.

## Acceptance criteria

- [ ] Temp-dir / file operations in `database-tasks.test.ts` go through the
      async fs surface used elsewhere in the package (no `*Sync` calls).
- [ ] `node:fs` / `node:os` / `node:path` imports are replaced with the
      package's adapter surface, or the story records why they must stay in a
      test file.
- [ ] Decide and document whether the `process.env` sites are in scope.
- [ ] Test names unchanged; all 77 tests still pass; `test:compare` delta
      non-negative.
