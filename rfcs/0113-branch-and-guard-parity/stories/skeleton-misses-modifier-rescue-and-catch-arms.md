---
title: "skeleton-misses-modifier-rescue-and-catch-arms"
status: done
updated: 2026-09-02
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 13
pr: 7387
claim: "2026-09-02T12:34:17Z"
assignee: "framework-deprecator-initializers-write-a-static-registry"
blocked-by: null
closed-reason: null
---

## Context

Two skeleton asymmetries the RFC 0113 noise-floor audit observed
(`docs/infrastructure/arm-mismatch-noise-floor.md`, "Extraction bugs found",
closing paragraph). Neither flagged a row on its own in the seed-113 sample, so
they were recorded rather than filed then; both still bias the report.

1. **Modifier `rescue` emits no `try`.** `walk_for_skeleton`
   (`scripts/api-compare/extract-ruby-api.rb:2385`) emits `try` only for a
   `:bodystmt` carrying a rescue/ensure clause. Ripper parses
   `@v = expr rescue nil` as an `:assign` over a `:rescue_mod` node — no
   `bodystmt` — so it emits nothing, while the faithful TS `try`/`catch` port
   emits `try`. Evidence: `activerecord/schema-dumper.ts#constructor` against
   `schema_dumper.rb#initialize`, whose `rescue nil` is invisible on the Ruby
   side.
2. **`catch` / `throw` blocks read as call reaches.** Ruby's
   `catch(:tag) { … }` is an ordinary `fcall`, so it contributes `ref:catch`,
   while its TS lowering (`try` + an `if` on the tag + a rethrow) contributes
   `try if throw`. Evidence: `activesupport/message-verifier.ts#decode` against
   `message_verifier.rb#decode`.

Both make a faithful port look like it invented arms. Companion to
`ruby-logical-op-assign-emits-no-skeleton-arm` and
`skeleton-loop-fold-covers-only-each`.

## Converged shape

The Ruby extractor emits `try` for `rescue_mod`, matching the TS side. For
`catch`/`throw`, decide and record ONE of: fold `catch` onto `try` where the
comparison happens (`foldSkeletonTokens`' place in the pipeline), or leave it
and document why the pair is not comparable — the audit's classification rule
is "would fixing the extractor alone clear the row", so an undecided asymmetry
keeps costing rows.

## Acceptance criteria

- [ ] `@v = expr rescue nil` emits `try` in the Ruby skeleton; a unit test pins
      it alongside the existing `bodystmt` case.
- [ ] The `catch`/`throw` asymmetry is either folded or documented at the fold's
      definition with its reason.
- [ ] `pnpm parity:api:arms:report`'s row count drops; before/after in the PR
      body.
- [ ] Nothing new gates — the arms report stays report-only (RFC 0113 measured
      it ungated).
