---
title: "One-line @missingRailsCall tag is silently ignored by the parser"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: 5856
claim: "2026-08-02T02:26:51Z"
assignee: "one-line-missing-rails-call-tag-silently-ignored"
blocked-by: null
closed-reason: null
---

## Context

`suppressedCallsIn` / `parseJsdoc`
(`scripts/api-compare/missing-rails-call-tags.ts`) match a tag with
`TAG_LINE = /^\s*\*?\s*@missingRailsCall\s+(\S+)(?:\s+—\s?(.*))?$/`, which is
anchored at end of line. A hand-written single-line block —
`/** @missingRailsCall first — reason */` — therefore matches nothing: the
trailing `*/` is part of the line.

Since PR #5754 made the tag load-bearing, the consequence is a SILENT no-op in
three places at once: the call is not suppressed by `checkCalls`, the tag is
not reported stale, and `parity:api:reasons` does not apply the empty-reason contract
to it (so `/** @missingRailsCall first */` with no reason at all passes the
lint). `parity:api:build` only ever emits the multi-line block form, so this is
purely a hand-authored-tag hazard — and it fails in the quiet direction.

Found while writing extractor tests for #5754: the first draft of the
bare-tag test used the one-line form and did NOT throw.

## Acceptance criteria

- A one-line `/** @missingRailsCall <call> — <reason> */` parses as a tag:
  suppresses in `checkCalls`, participates in stale-tag reporting, and is
  gated by `parity:api:reasons`.
- A one-line tag with no reason FAILS the empty-reason contract, exactly as
  the block form does.
- `renderJsdoc`/`renderEntry` round-trip is unchanged — `parity:api:build` keeps
  emitting the block form, and a second run over a hand-written one-line tag
  produces either zero edits or a clean normalization to block form (pick one
  and test it; do not leave it ambiguous).
- Tests live in `missing-rails-call-tags.test.ts` alongside the existing
  boundary cases.
