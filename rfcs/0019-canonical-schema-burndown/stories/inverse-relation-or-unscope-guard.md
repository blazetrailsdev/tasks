---
title: "inverse-of: .or/.unscope mark relation non-inversable"
status: ready
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Two `it.skip` tests in `inverse-associations.test.ts > InverseBelongsToTests`:
`"unscope does not set inverse when incorrect"` and `"or does not set inverse
when incorrect"` (Rails `inverse_associations_test.rb:872`/`:881`). Both build a
wrong `Human`, run `created_human.interests.or(human.interests)` /
`.unscope(:where)`, `.detect` the matching interest, and assert its `.human`
inverse is NOT wrongly set to the unrelated owner. Needs relation `.or` /
`.unscope` to mark the resulting relation as non-inversable
(Rails `inversable?` guard) plus collection `.detect`.

- trails: `packages/activerecord/src/associations/inverse-associations.test.ts`
- Rails: `activerecord/test/cases/associations/inverse_associations_test.rb:872`

## Acceptance criteria

- [ ] Un-skip both tests; converge `.or`/`.unscope` inversable guard. Names/
      assertions unchanged.
- [ ] `pnpm vitest run` for the file green.
