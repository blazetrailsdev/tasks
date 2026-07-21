---
title: "*_any/*_all bypass grouping_any/grouping_all"
status: ready
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Arel::Predications` implements every `*_any` / `*_all` variant by
delegating to the two private folders — `grouping_any(:eq, others)` /
`grouping_all(:eq, others)` (`vendor/rails/activerecord/lib/arel/predications.rb:231-241`),
which `send` the named predicate per element and then wrap the fold in a
`Nodes::Grouping`.

Trails' `packages/arel/src/predications.ts:264-329` instead has each variant
call the file-level `groupedAny` / `groupedAll` helpers
(`predications.ts:90-103`) with already-built nodes, e.g.
`eqAny` → `groupedAny(others.map((o) => this.eq(o)))`. `groupingAny` /
`groupingAll` exist (`predications.ts:357-374`) and are correct, but nothing
internal routes through them — they are reachable only from outside.

This is visible in the wide call-mismatch baseline: ~21 entries in
`scripts/api-compare/call-mismatches-wide-exclude/arel/attributes/attribute.json`
are exactly `<predicate>_any → grouping_any` / `<predicate>_all → grouping_all`
pairs, seeded under RFC 0047 and still flagging. Surfaced merging PR 5019
(`arel-attribute-include-predications-mixin`), which deleted `Attribute`'s
duplicate bodies in favor of the mixin and shrank that file 45 → 23 entries;
these are most of what remains.

The behavioral risk is the same one PR 5019 found in `when` /
`isDistinctFrom`: two fold paths that are _supposed_ to be one can drift.
`groupedAny` already differs from `groupingAny` at the empty-array edge —
`groupedAny([])` returns `Grouping(SqlLiteral("NULL"))`, while a
`groupingAny`-routed call would fold whatever `predicationDispatch` produced.

## Acceptance criteria

- [ ] `*_any` / `*_all` in `predications.ts` delegate to
      `groupingAny` / `groupingAll`, mirroring predications.rb:231-241, rather
      than calling `groupedAny` / `groupedAll` with pre-built nodes.
- [ ] Empty-array behavior is pinned by a test before and after (the
      `NULL`-grouping edge must not silently change).
- [ ] The corresponding `<predicate>_any → grouping_any` /
      `_all → grouping_all` entries are removed from
      `call-mismatches-wide-exclude/arel/attributes/attribute.json`; baseline
      only shrinks. Re-run `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls`
      before `pnpm api:calls:wide` — a stale artifact reports a false OK.
- [ ] api:compare / test:compare delta non-negative.
