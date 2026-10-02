---
title: "parity:api:moves reports a member ported in its reopening's own file as misplaced"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8412 flagged a move credited through `mixinMethodCreditedToOwnFile` as `inDefiningFile`
(`scripts/api-compare/compare.ts`, the `creditedToMixin` arm of the per-method loop) and made
`relocationsByRoute` in `scripts/api-compare/moves.ts` leave it out: the body sits in the TS file mirroring the
Ruby file that defines the method, so there is nothing to relocate.

The next arm, `reopeningMethodCreditedToOwnFile` (`compare.ts:3019`, called at `:5480`), is the same kind of
credit. A method defined by a reopening of the class in another Ruby file (`blank?` in
`core_ext/object/blank.rb:14`, bucketed under `core_ext/object/acts_like.rb` because that file reopens `Object`
first) is ported in the TS file mirroring the reopening, and still pushes an unflagged move. `parity:api:moves`
then tells the reader to move it out of the file Rails defines it in.

## Converged shape

The `creditedToReopening` push sets `inDefiningFile: true`, as the `creditedToMixin` push does.

## Acceptance criteria

- [ ] A move credited through `reopeningMethodCreditedToOwnFile` carries `inDefiningFile` and is absent from
      `pnpm parity:api:moves`.
- [ ] `scripts/api-compare/moves.test.ts` covers the reopening shape.
- [ ] The per-package before/after counts are reported in the PR, and `parity:api` per-package method totals
      do not move.
