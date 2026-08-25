---
title: "shard-unreviewed-mark-per-file"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 5922
claim: "2026-08-02T20:44:08Z"
assignee: "shard-unreviewed-mark-per-file"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-wide-unreviewed.json` is a single repo-wide
high-water mark (`{ "max": 2101 }`) — the RFC 0083 "second ratchet": an
only-shrink counter on how many wide-call-mismatch baseline entries still carry
the verbatim `DEFAULT_REASON` seed (`scripts/api-compare/unreviewed-ratchet.ts:1-42`
documents the contract; the gate arms live in
`scripts/api-compare/lint-call-mismatches-wide.ts:486-491` and the `--write` path
that lowers the mark in `lint-call-mismatches-wide.ts:459-465`).

Because it is ONE global number, every PR that reviews a seeded reason (or
reseeds) rewrites that one file, so any two concurrent PRs conflict on it. It is
a serialization point for the whole repo.

The exclude baseline already solved this: it is sharded at
`scripts/api-compare/call-mismatches-wide-exclude/<package>/<tsFile .ts→.json>`,
one JSON file per source file (see `lint-call-mismatches-wide.ts:46-59` for the
layout rationale, `:147-156` for `relPathFor`, `:196-205` for the concat reader,
`:213-232` for the per-(package,tsFile) writer). Shard the unreviewed mark the
same way so a PR reviewing reasons in `relation.ts` touches only that file's
mark.

At the moment of the split the baseline holds 2281 entries across 396 files, of
which 2101 (in 376 files) still carry the seed — so the per-file marks must sum
to exactly 2101.

## Acceptance criteria

- The mark is sharded to `call-mismatches-wide-unreviewed/<package>/<tsFile
.ts→.json>`, each `{ "max": N }`; the monolithic
  `call-mismatches-wide-unreviewed.json` is deleted.
- The migration is numerically faithful: the sum of the new per-file marks equals
  2101, derived from the current baseline's seeded rows (not hand-written).
- The RFC 0083 contract survives per file: only-shrink, `--write` lowers each
  file's mark using only rows ALREADY in that file's baseline, newly-seeded rows
  held out and listed separately, gate red on excess, gate red on slack.
- All readers updated: `baseline-json.test.ts` canonical-form list, the CI
  `Wide ratchet baseline reseed drift` step's `mark=` path, and any of
  `build.ts` / `compare.ts` / `scripts/prism-codegen/catalog.ts` / `score-cli.ts`
  that name the old path.
- Tests cover the sharded shape in `unreviewed-ratchet.test.ts` and
  `lint-call-mismatches-wide.test.ts`.
- `pnpm parity:api:calls` is green with no drift against a clean reseed.
