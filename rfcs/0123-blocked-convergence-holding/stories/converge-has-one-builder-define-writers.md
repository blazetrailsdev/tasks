---
title: "converge-has-one-builder-define-writers"
status: blocked
updated: 2026-09-15
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-15T16:33:10Z"
assignee: "converge-has-one-builder-define-writers"
blocked-by: "Branch-free base defineWriters cannot serve both macros: belongs_to needs the sync property setter (removing it reds ~40 belongs-to-associations tests), while has_one's writer is async on a persisted owner, so emitting the same property setter for has_one drops the replace promise (has-one-persisted-setter-throws.trails.test.ts: setAttributes loses firm_id; property write starts a stray transaction -> 'cannot start a transaction within a transaction'). Emitting name= + setX in the base is fine (373/376 green); the property-setter half needs a decision: either a per-association sync/async dispatch (a branch the AC forbids) or a ratified rule that async singular writers expose no property setter."
closed-reason: null
---

## Context

Split from `converge-has-one-builder-and-through-writer-overrides`, which converged
`HasOne.defineConstructors` and `HasOneThroughAssociation#reset` / `#writer`.

`packages/activerecord/src/associations/builder/has-one.ts` still overrides
`defineWriters`. Rails `Builder::HasOne` defines no `define_writers`; it inherits
`Builder::Association.define_writers` (`activerecord/lib/active_record/associations/builder/association.rb:112-118`),
which emits `def #{name}=(value); association(:#{name}).writer(value); end`.

The TS override exists because the has_one writer is async: it emits `set${Name}()` (the
settled `setX()` idiom for an async `x=`) plus a `"${name}="` method, and deliberately
leaves `name` a getter-only accessor (`has-one-persisted-setter-throws.trails.test.ts`,
"assigning the property is a plain JS write to a getter-only accessor"). The base
`Association.defineWriters` (`builder/association.ts:196`) emits a property setter, which
belongs_to relies on. Deleting the override breaks ~30 has_one tests.

## Acceptance criteria

- `HasOne.defineWriters` is deleted; the writer shape lives in `Builder::Association.define_writers`
  (the Rails home), without inventing a per-macro branch there.
- Its `@noRailsEquivalent CONVERGEABLE` receipt is removed and `pnpm parity:api:extra:tighten` run.
- has_one / belongs_to suites stay green.
