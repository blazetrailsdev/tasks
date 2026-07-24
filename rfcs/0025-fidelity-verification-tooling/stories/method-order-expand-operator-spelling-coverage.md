---
title: "Method-order: expand per-class operator spelling coverage beyond []"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
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

PR #5226 introduced `scripts/api-compare/operator-order-spelling.ts` with a
per-fqn `OPERATOR_SPELLING_BY_FQN` table so Ruby operator methods get their
Rails source position in the method-order manifest. To stay verified-only, it
seeded just four `[]` entries (`Arel::Table`, `ActiveModel::Errors`,
`ActiveModel::AttributeSet::LazyAttributeHash` → `get`; `ActiveModel::AttributeSet`
→ `getAttribute`).

Other operator ports remain unmapped and so are still relegated past the mapped
block: additional `[]` classes, plus `==` (`equals`/`isEqualTo`), `<=>`
(`compare`), `[]=` (setters), etc. across arel/activemodel/activerecord.

## Acceptance criteria

- [ ] Audit Rails classes that define operator methods whose TS port exists but
      is unmapped in `OPERATOR_SPELLING_BY_FQN` (grep Ruby `def ==`, `def <=>`,
      `def []`, `def []=` in vendored Rails; cross-check the TS member).
- [ ] Add verified `(fqn, operator)→spelling` entries; each cited against both
      the Rails source line and the actual TS member (as the existing four are).
- [ ] Reorder any surfaced source members to Rails order (the
      `rails-file-structure-method-order` rule autofix), pure relocations.
- [ ] Do NOT add unverified/global name entries — the AttributeSet `get`
      invention must never be pulled into the `[]` slot.
