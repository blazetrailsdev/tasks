---
title: "sqlite3_mem takes the full-load boot arm every time — the canonical-schema stamp cannot apply to a per-boot :memory: database"
status: done
updated: 2026-08-18
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6710
claim: "2026-08-18T18:37:42Z"
assignee: "port-test-date-sub-class-propagation"
blocked-by: null
closed-reason: null
---

## Context

Measured finding from [[measure-adapter-specific-arm-saving-across-lanes]]
(PR #6705), which timed the adapter-specific boot arm on every lane available.
The full method and numbers are in that story.

The `sqlite3_mem` lane behaved unlike the other three: across a 24-file run,
**zero boots took the fast path at all**. `canonicalSchemaUpToDate`
(`packages/activerecord/src/support/canonical-schema-stamp.ts`) is false on every
boot because each worker's `:memory:` database is brand new, so
`test-setup-dy.ts`'s `else` branch — the full purge-and-reload — runs
unconditionally, on every single boot, for the whole lane.

For contrast, on the lanes that DO have a fast path the memo saves 20.5 ms/boot
(sqlite file) and 174.7 ms/boot (PostgreSQL 17, ~2.3 min extrapolated over a
full run).

This is not a regression introduced by anything recent — it is structural, and it
had simply never been recorded. The consequence is that `sqlite3_mem` pays the
full canonical schema load on every boot, which is the most expensive arm, and
none of the stamp/memo machinery (RFC 0028, #6121, #6324) helps it.

No Rails counterpart — trails-only test bootstrap plumbing.

## Converged shape

Establish first whether this is worth fixing at all: `sqlite3_mem` is a
label-gated CI lane (`run-sqlite-mem`, `.github/workflows/ci.yml`), not a
per-PR lane, so its total cost may not justify the work. Measure the full-load
arm's per-boot cost on that lane before designing anything — if it is small in
absolute terms because `:memory:` DDL is cheap, close this as measured-and-fine
rather than building machinery.

If it IS worth fixing, the shape is a process-wide (not database-wide) template:
lay the canonical schema once per worker process and have each subsequent
`:memory:` database clone from it, since the usual cross-boot stamp cannot work
when the database itself does not survive the boot. Note `in_memory_db?` is true
only on this lane (`ci.yml:789`), so any such path is lane-specific by
construction and must not perturb the other three.

## Acceptance criteria

- [ ] The full-load arm's per-boot cost on `sqlite3_mem` is measured in absolute
      terms, from outside a single boot (same method as the sibling story; do
      NOT re-derive an assertion from the state the boot decided on).
- [ ] Either a per-process template path lands for that lane, or the story is
      closed with the measurement showing the cost does not justify it.
- [ ] The other three lanes (sqlite file, PG, MariaDB) are unaffected either way.
