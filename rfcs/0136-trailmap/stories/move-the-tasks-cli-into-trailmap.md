---
title: "Move the tasks CLI into trailmap and make it an HTTP client"
status: ready
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: ["serve-the-read-verbs-as-json", "serve-the-mutation-verbs-as-json"]
deps-rfc: []
est-loc: 250
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `tasks` CLI moves into trailmap and becomes an HTTP client. It keeps
everything a person sees — argument parsing, usage text, output formatting —
and loses `db.ts`, `models/`, `verbs.ts`, `ranking.ts`, `readmodel.ts`,
`db-path.ts` and the vendored ActiveRecord. Each verb becomes one request
against `TRAILMAP_URL`, defaulting to loopback.

This is what makes the move possible: today the CLI must sit beside the
database because it _is_ the data access layer, needing a checkout with
`node_modules`, a vendored `tsx`, and cwd-based resolution of which working
tree it acts on. As a client it needs a URL.

Four call sites change, and they must change together — a half-migrated
`tasks` that resolves to two implementations depending on cwd is worse than
either:

| Caller                  | Today                                                                                                                    | After                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| trails' `pnpm tasks`    | `scripts/tasks/tasks.sh` probes `$TASKS_DIR`, `$RFCS_DIR`, `$PWD/tasks`, `~/github/blazetrailsdev/tasks` for `bin/tasks` | Execs the installed binary; probe list deleted |
| `tasks` on `PATH`       | Installed by `start-worktree.sh` into a tasks checkout                                                                   | Installed from trailmap; location-independent  |
| ringo's Go side         | Resolves `tasksCLIRel` + vendored `tsx`, shells out (`mergesweep.go:85`)                                                 | An HTTP request                                |
| trails' `CLAUDE.md:174` | "The `tasks` CLI itself lives in the tasks repo"                                                                         | Points at trailmap                             |

## Acceptance criteria

- `bin/tasks` lives in trailmap and speaks HTTP only.
- Every verb prints byte-identical stdout to the current CLI for the same
  inputs, and leaves identical database state.
- All four call sites are updated in the same change.
- `tasks` works identically from a trails worktree, the tasks checkout, and an
  unrelated directory.
- A clear error names the app when it is unreachable.
