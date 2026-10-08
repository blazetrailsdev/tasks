---
title: "activerecord: constructing a model over a cold schema raises; decide the error and its scope"
status: draft
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Owner ruling, 2026-10-08 (blocked-story triage, decision 5): constructing a
model over a cold schema raises. Today a cold peek answers `undefined` and the
model stays unloaded (trails CLAUDE.md § "Schema reflection peeks at a warm
cache"), and three trails-only guards cover the gap:

- the `!stiEnabled` disjunct in the STI `new` gate
  (`packages/activerecord/src/inheritance.ts`; Rails
  `vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:56-78`)
- the `_defaultAttributes` reset in `applyColumnsHash`
  (`packages/activerecord/src/model-schema.ts`; Rails `_default_attributes`,
  `attributes.rb:241-252`)
- the cold-schema replay flag (`packages/activerecord/src/attributes.ts:49-54`)

Rails has no cold case: `load_schema!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:587-597`)
reflects in line. The ruling was not written into CLAUDE.md with trails#8685,
because what the raise is has not been decided.

Measured when the enum guard's removal was tried (2026-10-07): 162 files under
`packages/` hold an ad-hoc `class X extends Base` with a declared attribute, 76
of them in `activerecord/src` with no `fixtures()` warm, and 18 tests in
`attribute-methods.trails.test.ts` and `attributes.test.ts` go red.

## Acceptance criteria

- A decision, recorded in CLAUDE.md § "Schema reflection peeks at a warm
  cache": the error class and message a cold `new` raises, whether a model with
  no table (`abstract_class`, or no connection) is exempt, and whether sync
  readers other than `new` keep answering `undefined`.
- A plan for the test models built with no warm step: how many, and the warm
  step they get.
- `converge-new-sti-gate-drop-stienabled-disjunct`,
  `converge-default-attributes-reset-points-onto-rails` and
  `enum-undeclared-type-raise-reads-no-cold-schema-replay-flag` are re-cut
  against the decision and unblocked.
