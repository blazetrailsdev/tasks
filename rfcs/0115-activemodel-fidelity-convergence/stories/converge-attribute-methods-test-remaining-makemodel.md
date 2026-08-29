---
title: "converge-attribute-methods-test-remaining-makemodel"
status: draft
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
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

The last `makeModel()` callers in
`packages/activerecord/src/attribute-methods.test.ts` after the time-zone and
`alias_attribute`-raise groups are split out. Each is still placeholder-shaped.
Rails counterparts in
`vendor/rails/activerecord/test/cases/attribute_methods_test.rb`:

- `aliasing \`id\` attribute allows reading the column value for a CPK model`
  (:63) — reads `Cpk::Order` (`test-helpers/models/cpk.ts`'s `CpkOrder`).
- `declared prefixed attribute method affects respond_to? and method_missing`
  (:656), `... suffixed ...` (:670), `... affixed ...` (:684) — these mutate
  `ActiveRecord::Base`'s `attribute_method_patterns`, which is why the Rails
  class has a `setup`/`teardown` pair (:39-45) saving and restoring them. The
  trails describe has no such pair; it needs one before these can be ported.
- `attribute predicates respect access control` (:1018) and
  `bulk updates respect access control` (:1028) — both go through the private
  `privatize(method_signature)` helper (:1597).
- `#undefine_attribute_methods undefines alias attribute methods` (:1098) —
  its middle arm asserts that reading the undefined alias off an EXISTING
  record re-generates the method (Ruby `method_missing`). trails generates
  attribute methods from `Core#init_internals`
  (`packages/activerecord/src/core.ts:614`) at construction time and has no
  per-record `method_missing`, so a read off an already-constructed record
  regenerates nothing. Converging this arm needs that gap closed, not a
  reworded assertion.
- `calling super when the parent does not define method raises NoMethodError`
  (:1257) — goes through the private `new_topic_like_ar_class(&block)` helper
  (:1560), which also asserts the class generated no attribute methods.

## Acceptance criteria

- [ ] `makeModel()` is deleted; no test in the file builds a bespoke `Post`.
- [ ] The `setup`/`teardown` pattern-save-and-restore, `privatize`, and
      `new_topic_like_ar_class` are ported as Rails has them.
- [ ] Each converted test asserts its Rails counterpart's assertions.
- [ ] `pnpm parity:test:assertions` delta non-negative; AR suite green on all
      three lanes.
