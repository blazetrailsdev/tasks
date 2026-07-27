---
title: "Core#== / #<=> live in base.ts as isEqual, not in core.ts"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing Ruby operator methods for `OPERATOR_SPELLING_BY_FQN`
(PR #5247, RFC 0025).

`ActiveRecord::Core` defines both equality operators in
`vendor/rails/activerecord/lib/active_record/core.rb`:

- `core.rb:631` `def ==(comparison_object)`
- `core.rb:665` `def <=>(other_object)`

Our port has neither in `packages/activerecord/src/core.ts` — that file only
declares `isEqual(other: unknown): boolean` on a host interface (core.ts:43).
The implementation lives in `packages/activerecord/src/base.ts:4546` as
`equals(other) { return this.isEqual(other); }`, a wrapper over `isEqual`.

Two consequences:

1. Method-order cannot map `Core#==` / `Core#<=>` to any member of `core.ts`,
   so both stay unmapped and their Rails source positions are unenforced. They
   were deliberately left out of `OPERATOR_SPELLING_BY_FQN` in #5247 for exactly
   this reason — an entry pointing at `base.ts` would be dead.
2. It violates the api:compare invariant that a method stays in the file
   matching Rails' layout (CLAUDE.md "Module mixins"; see also the
   `api_compare_method_must_stay_in_rails_layout_file` convention).

`<=>` has no TS counterpart at all under any spelling.

## Acceptance criteria

- [ ] `Core#==` is ported in `core.ts` under a single spelling (`equals`),
      following the `this`-typed mixin convention, rather than as a `base.ts`
      wrapper over `isEqual`.
- [ ] `Core#<=>` is ported in `core.ts` as `compare`, matching core.rb:665
      semantics (compares by `id` when both are the same class, else nil/undefined).
- [ ] Existing `isEqual` callers keep working (rename or delegate — decide at
      the call site and justify there).
- [ ] Add `"ActiveRecord::Core": { "==": ["equals"], "<=>": ["compare"] }` to
      `scripts/api-compare/operator-order-spelling.ts`; the manifest build must
      stay green (it now FAILS on dead entries).
- [ ] Members reordered to Rails source order via the
      `rails-file-structure-method-order` autofix.
