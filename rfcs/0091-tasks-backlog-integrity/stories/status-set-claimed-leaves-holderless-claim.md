---
title: "status-set claimed writes a holderless claim that validate rejects and claim refuses to repair"
status: draft
updated: 2026-09-30
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`statusSet` (`src/verbs.ts:316-324`) writes any status with `clearedBy(status)`
and nothing else, so `tasks status-set <id> claimed` produces a `claimed` row
with `claim: null` and `assignee: null`. `validate`
(`scripts/validate-lib.mjs`) rejects exactly that shape ("status: claimed
requires a claim timestamp" / "requires an assignee"), but only once `export`
writes the row to markdown — at which point tasks `main` is red and every open
tasks PR fails `validate` with an error in a file it never touched.

The row cannot be repaired with the obvious verb either: `claim`
(`src/verbs.ts:112-155`) treats any `status: claimed` row as taken and refuses
with "already claimed", even when nobody holds it. The only way out is
`status-set <id> ready` followed by `claim`.

Observed 2026-09-30: an agent ran `status-set attribute-set-accepts-lazy-attribute-hash
claimed` (event 218342); the next state sync exported it and tasks #196 / #201
went red on `validate` until the operator ran status-set ready → claim → export.

## Acceptance criteria

- [ ] `tasks status-set <id> claimed` is refused with a message pointing at
      `tasks claim <id> [--assignee NAME]`, so the invariant validate enforces
      cannot be produced through the CLI. Same for `in-progress` if validate
      holds it to the same fields (check `validate-lib.mjs` and match it).
- [ ] `tasks claim` accepts a `claimed` row whose `claim`/`assignee` are null
      (a holderless claim) and fills them, rather than reporting it as taken.
- [ ] Tests in `src/verbs.test.ts` for both arms.
