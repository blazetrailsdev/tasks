---
title: "wave-5-head-sweep"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0106's exit condition is **0 rows with `kind: "set"` under
`scripts/api-compare/call-mismatches-exclude/**`for`activerecord`, `arel`and`activesupport`**. Waves 1-3 and 4a-4g have taken that population from 1,134
rows / 217 files (2026-08-14) down to **445 rows across 155 files\*\* (measured on
the wave-4g branch, 2026-08-21).

`wave-4g-tail-sweep` was scoped to the `<=3`-rows-per-file tail. That tail is
now fully dispositioned: every one of its 189 remaining rows carries a reviewed
per-site reason or a `@missingRailsCall` tag, and the twelve that still held the
RFC 0047 seed placeholder were closed in PR #6845 (two by convergence).

What is left is the **head**: **256 rows across 37 files carrying 4 or more rows
each**. Top of the distribution:

    17  activerecord/schema-dumper.json
    14  activerecord/relation/query-methods.json
    13  activerecord/migration.json
    12  activerecord/connection-adapters/abstract/schema-statements.json
    10  activerecord/connection-adapters/abstract/connection-pool.json
    10  activerecord/connection-adapters/abstract/schema-definitions.json
    10  activerecord/connection-adapters/sqlite3-adapter.json
     9  activerecord/connection-adapters/postgresql-adapter.json
     9  activerecord/relation/finder-methods.json
     8  activerecord/store.json

Regenerate the current distribution with

    API_COMPARE_FORCE=1 pnpm parity:api --calls

then group `call-mismatches-exclude/**` by file at `kind: "set"`.

This is the last slice of the RFC. It is filed as a single story because the
disposition classes are settled by now — the sweep applies them rather than
deriving new ones — but it will not fit one PR: 37 files at a 700 LOC ceiling is
several. Ship them as sequential non-overlapping PRs from `main`, never stacked.

## Acceptance criteria

- [ ] Every one of the 256 head rows is either converged or leaves as a reviewed
      one-line per-site reason / a `@missingRailsCall` tag at the call site.
      A row exits by convergence or by a reason reached against the Rails body —
      never by a name-keyed bulk edit, a broadened reason, or a move to another
      register.
- [ ] Rows deleted by hand via `serializeBaseline`; a shard left empty is
      deleted, not committed as `[]`. Then `pnpm parity:api:calls:tighten
  <shard>` for each shard touched. No `--write`, no reseed, ever.
- [ ] **RFC 0106 exit condition met**: `call-mismatches-exclude/**` reports 0
      rows with `kind: "set"` for `activerecord`, `arel` and `activesupport`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Anything that cannot converge is filed as its own story with the Rails
      `file:line`, not ratified in place.
