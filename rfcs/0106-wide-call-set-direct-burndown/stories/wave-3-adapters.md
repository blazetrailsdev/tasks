---
title: "Wave 3: the adapters — 125 rows across five files"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: 2
pr: 6560
claim: "2026-08-15T12:03:42Z"
assignee: "wave-3-adapters"
blocked-by: null
closed-reason: null
---

# Wave 3: the adapters — 125 rows across five files

## Context

Measured 2026-08-14 (`API_COMPARE_FORCE=1 pnpm parity:api --calls`, counted over
`scripts/api-compare/call-mismatches-exclude/**` at `kind: "set"`). Five adapter
files carry **125 of RFC 0106's 1,134 in-scope rows**:

| File                                                | Rows |
| --------------------------------------------------- | ---: |
| `connection-adapters/sqlite3-adapter.ts`            |   33 |
| `connection-adapters/abstract-mysql-adapter.ts`     |   30 |
| `connection-adapters/postgresql-adapter.ts`         |   29 |
| `connection-adapters/abstract/schema-statements.ts` |   18 |
| `connection-adapters/abstract-adapter.ts`           |   15 |

This wave is independent of Waves 1–2 (no file overlap) and can run in parallel
with them.

## Coordinate, do not collide

Three draft RFCs hold open stories over these exact files, and this wave will
touch rows their stories are also about:

- **RFC 0076 execute-primitive-convergence** (13 open) — `internal_execute`,
  `perform_query`, `raw_execute` and `execute_batch` rows. The in-scope
  frequency table shows `internal_exec_query` 12 and `internal_execute` 10, so
  this overlap is real and not incidental.
- **RFC 0077 quoting-binds-fidelity** (7 open) — `quote_table_name` 11 and the
  quoting family.
- **RFC 0094 sqlite3-adapter-construction-fidelity** (7 open) — the
  `sqlite3-adapter.ts` constructor rows.

**RFC 0106's model is to converge the row directly rather than wait for the
owning RFC** — that is the whole point of retiring 0084's discovery-feed
delegation, and it is what this wave is for. But "converge it here" is not
"ignore the other story": before converging a row that a named open story is
about, read that story. If its fix is genuinely bigger than the row (a whole
primitive re-routed, a constructor re-shaped), converge what the row asks and
leave the larger fix to the owning story, saying so in the PR body. If the row
_is_ the fix, converge it and close the owning story with a pointer to your PR.

The failure mode to avoid is two agents editing the same adapter method from two
RFCs in the same week. Check open sibling PRs before starting — story contexts
here frequently target an unmerged branch, so work can look missing from `main`
when it is merely unlanded.

## Adapter-specific hazards

- **Every arm must be ported.** A Rails adapter body that branches on
  `current_adapter?` has one arm per adapter; dropping an arm in the port is the
  single most common cause of a one-lane CI failure in this area.
- **All three lanes must be green**, not just SQLite. These files are the ones
  where a SQLite-only local run proves the least.
- `with_connection` is 34 rows across the in-scope population and concentrates
  here; note that RFC 0073 (permanent-connection-checkout, draft) is about the
  same seam. Converge the call, do not re-litigate the lease model.

## Acceptance criteria

- [ ] For each of the five files, every row is converged, or carries a reviewed
      one-line reason / `@missingRailsCall` tag at the call site.
- [ ] Rows overlapping RFC 0076 / 0077 / 0094 stories are reconciled explicitly:
      the PR body names each affected story and states whether it is now closed,
      narrowed, or untouched.
- [ ] No `current_adapter?` arm is dropped; adapter-conditional bodies keep every
      branch.
- [ ] Rows deleted by hand from their shards; stale marks fixed with
      `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` green; in-scope count falls and does not rise.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — all three, on every PR
      in this wave.

## Notes

125 rows across five files is 3–5 PRs. Split per file and file each as its own
story; do not fan out PRs from this claim.
