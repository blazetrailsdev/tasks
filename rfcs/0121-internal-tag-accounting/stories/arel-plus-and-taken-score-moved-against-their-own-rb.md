---
title: "arel-plus-and-taken-score-moved-against-their-own-rb"
status: draft
updated: 2026-08-27
rfc: "0121-internal-tag-accounting"
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

Split out of `file-level-no-rails-equivalent-cannot-cover-import-less-files`,
which carried it as a second, independent blocker. The file-level half landed
(detached-block file tags); this half is untouched and still blocks
`enroll-arel-in-unbacked-internal-receipt-lint`.

Un-`@internal`-ing `SqlLiteral#plus` and `SelectManager#taken` — both genuinely
PUBLIC in Rails — moves arel's `total` because both score as **moved**, i.e.
`extra-surface.ts` attributes the Ruby name to a different `.rb` than the TS
file maps onto:

- `taken` is `alias :taken :limit` at
  `vendor/rails/activerecord/lib/arel/select_manager.rb:22` — the very file
  `packages/arel/src/select-manager.ts` maps onto, so the `moved` verdict looks
  like a real mapping bug (an alias the Ruby extractor records against a
  different owner, or a candidate the TS side spells differently) rather than a
  misplaced port.
- `plus` is `def +(other)` in
  `vendor/rails/activerecord/lib/arel/nodes/sql_literal.rb`. Re-measured after
  #7079 named operator symbols in the Ruby extractor, arel still sat at `0/62`,
  so #7079 did not resolve this half.

Do NOT resolve this by raising the mark or by an `--exclude-glob` (an exclusion
disarms the STALE gate — see `extra-surface.ts` `main()`).

## Acceptance criteria

- Root cause named for `SqlLiteral#plus` and `SelectManager#taken` scoring
  `moved`, and fixed at the mapping (or at the port's location), not tagged
  around.
- Removing the `@internal` from both leaves `pnpm parity:api:extra:gate` green
  with arel's marks moving DOWN or not at all.
- `pnpm exec tsx scripts/api-compare/extra-surface.ts` exits 0.
