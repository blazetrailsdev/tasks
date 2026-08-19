---
title: "Wave 4d: the associations residue"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
pr: 6725
claim: "2026-08-18T20:58:55Z"
assignee: "wave-4d-associations-residue"
blocked-by: null
closed-reason: null
---

# Wave 4d: the associations residue (94 rows)

## Context

Waves 1-3 of this RFC are all `done`, so per the Rollout section Wave 4 is now
due: "the rest of the head and then the <=3-row tail". Re-measured against
`origin/main` on 2026-08-17 over `scripts/api-compare/call-mismatches-exclude/**`
at `kind: "set"`, restricted to `activerecord` / `arel` / `activesupport`:

**900 rows across 213 files** (down from the RFC's 1,134 / 217 baseline of
2026-08-14) — activerecord 739, activesupport 161, arel 0.

Wave 4 is filed as one story per file cluster so the slices stay
non-overlapping and standalone from `main`, the way waves 1-3 were.

### The slice

94 rows across 20 association shards, 22 of them in <=3-row files:

    associations/has-one-association.json             12
    associations.json                                 10
    associations/has-many-through-association.json    10
    associations/belongs-to-association.json           9
    associations/has-one-through-association.json      8
    associations/has-many-association.json             7
    associations/association.json                      6
    associations/builder/has-and-belongs-to-many.json  6
    associations/join-dependency.json                  4
    + 11 shards with 1-3 rows each

This is the cluster RFC 0075 (collection-association) nominally owns. The RFC's
"Why 0084's model stalled" section measured 0075 at 0 done / 21 open and still
`draft`, which is exactly why this RFC converges these rows directly instead of
waiting. Check 0075's story list before starting so a converged row is not
re-litigated there, but do not block on it.

The `CollectionProxy` work already landed under this RFC (PRs #6588, 6592,
6595, 6601, 6609, 6610 and 6612) is the precedent for the shape these
convergences take: delegate to the scope or call `super` rather than re-implementing, and let
the row retire as a consequence.

The class rules from the RFC apply unchanged: **a class-wide action requires a
receiver split** — join to the Ruby call site via `output/rails-api.json` and
split by receiver before writing a shared reason or a bulk conversion. This
cluster is the highest-risk one for the `first`/`last`/`any?`/`size`/`include?`
homonyms, because an association proxy receiver reads exactly like an Array.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before
      trusting any NEW row (see `call-mismatches-partial-regen-invents-phantom-rows`).
- [ ] Split across more than one PR if the LOC ceiling demands it — ship the
      first slice and file the rest rather than exceeding the ceiling.
