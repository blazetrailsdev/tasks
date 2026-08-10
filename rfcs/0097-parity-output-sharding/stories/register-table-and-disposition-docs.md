---
title: "Register table, path-convention doc, and the not-sharded disposition record"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps:
  [
    "shard-arity-exclude",
    "shard-body-pins-and-inheritance-exclude",
    "shard-api-compare-extraction-manifests",
    "shard-api-compare-comparison-artifacts",
    "shard-test-compare-output",
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0097 turns six files into directories across api-compare and test-compare.
Each migration story updates the prose it directly touches, but three
cross-cutting surfaces describe the register set _as a whole_ and go stale
piecemeal if nobody owns them at the end:

- `scripts/parity/README.md:41-50` — the register table, one row per path with a
  `Kind` column that today reads `exclude (sharded)` for the three
  `call-mismatches-*` trees and bare `exclude` / `pin` / `mark` / `baseline` for
  the rest. `:52-56` ("Do not move these files… the sharded ones
  (`call-mismatches-*`) are split per source file") names the sharded set
  explicitly and will be wrong once the set grows.
- `CLAUDE.md` and `CONTRIBUTING.md` — the "Before you open the PR" checklist and
  the burndown-ledger section name `arity-exclude.json` and the
  `call-mismatches-exclude` baselines by path. Docs-only changes are LOC-exempt,
  so there is no reason to leave a stale path anywhere.
- The **disposition record**. RFC 0097 declines to shard three registers, and
  the reasons must be discoverable from the files themselves, not only from the
  RFC: `schema-compare/invented-baseline.json` (database identifiers, no
  source-file field), `test-compare/assertion-mismatch-mark.json`
  (per-package counters; sharding would not move the conflict number because
  nearly every edit is to `activerecord`), and
  `scripts/non-transactional-row-writes.json` (`RATCHET_PATH` at
  `non-transactional-row-writes.ts:71` — a flat list of 9 test-file paths whose
  row content _is_ its own path, so sharding yields 9 empty files, which RFC
  0097's empty-file policy says should not exist at all).

Each disposition has a stated **revisit trigger** in the RFC; those triggers are
the thing most likely to be lost, and they are what stops a later reader from
"finishing the job".

This story lands **last**, after the trees it describes exist.

## Acceptance criteria

1. `scripts/parity/README.md`'s table marks every migrated tree `(sharded)` and
   its trailing paragraph names the sharded set correctly rather than
   enumerating `call-mismatches-*`.
2. The README gains a short **"Not sharded, and why"** subsection naming
   `invented-baseline.json`, `assertion-mismatch-mark.json`, and
   `non-transactional-row-writes.json`, each with its one-line reason and its
   revisit trigger, linking to RFC 0097.
3. A header comment in each of those three files (or its enforcing lint, where
   the JSON cannot carry comments) points at the RFC 0097 disposition, so
   someone reading the file alone learns it is a deliberate exception.
4. `CLAUDE.md` and `CONTRIBUTING.md` reference every migrated register by its
   directory path. No `.json` path survives for a migrated register anywhere in
   `docs/`, `CLAUDE.md`, or `CONTRIBUTING.md` — grep is the check.
5. The path convention is stated once in `scripts/parity/README.md`
   (`<tree-root>/<package>/<source path, extension → .json>`, non-matching
   extension throws, no file for zero rows) and every other mention links to it
   rather than restating it.
6. Writer discipline restated in the same place: `serializeBaseline` only,
   canonical row order, never `--write`/reseed to fix one stale row.
7. Docs-only PR. No code, no register bytes, no gate behaviour change.
