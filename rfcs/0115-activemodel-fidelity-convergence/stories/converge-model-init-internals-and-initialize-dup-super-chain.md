---
title: "Converge Model#initInternals / #initializeDup onto a real mixin super chain"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: ["activemodel", "activesupport"]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6802
claim: "2026-08-21T02:10:29Z"
assignee: "converge-duration-equals-non-duration-arm-to-a-ruby-send"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #6798 (`retire-activemodel-this-rebinding-thunks`), which retired 65
`this`-rebinding thunks from `packages/activemodel` onto `extend()` /
`include()`. Four call sites survive, in two methods, and are the mixin `super`
chain rather than ordinary rebinding:

`packages/activemodel/src/model.ts`

```ts
initInternals(): void {
  validationsInitInternals.call(this);
  dirtyInitInternals.call(this);
}

initializeDup(other: unknown): void {
  validationsInitializeDup.call(this, other);
  dirtyInitializeDup.call(this, other);
}
```

In Ruby each included module defines the method and **opens with `super`**, so
the chain is the include order itself:

- `activemodel/lib/active_model/validations.rb:467-471` — `def init_internals;
super; @errors = nil; @context_for_validation = nil; end`
- `activemodel/lib/active_model/dirty.rb:371-376` — `def init_internals; super;
@mutations_before_last_save = nil; @mutations_from_database = nil; end`
- `activemodel/lib/active_model/validations.rb:310-313` and
  `activemodel/lib/active_model/dirty.rb:248-251` — the `initialize_dup` pair,
  both `super`-opening
- `activemodel/lib/active_model/attributes.rb:112-115` — `initialize_dup`
  replaces `@attributes` before either of the above runs
- `activerecord/lib/active_record/core.rb:834` — the only root definition of
  `init_internals`; ActiveModel has none

Neither settled workaround reaches this today:

- `include()` (`packages/activesupport/src/include.ts`) copies members onto one
  prototype, so the second module's copy overwrites the first's with no way to
  reach it — the chain collapses to one link.
- `prepend()` (`packages/activesupport/src/prepend.ts`) supplies an explicit
  `super_`, but refuses a target that has no method to wrap
  (`prepend: cannot wrap ${name} — target has no method with that name`), and
  ActiveModel defines no root for `init_internals`. Manufacturing an AM-side
  root is surface Rails does not have.

Reviewed and accepted on #6798 as a TS language shortcoming, justified at both
call sites. This story is the convergence: it exists to remove the deviation,
not to ratify it.

## Converged shape

Either give `include()` real ancestry semantics for plain-object modules — it
already splices a carrier into the prototype chain for a `Module` instance
(`include.ts:203-213`), which is what lets a later module's method reach an
earlier one — so `include(Model, ValidationsInstanceMethods)` followed by
`include(Model, DirtyInstanceMethods)` gives Dirty's `initInternals` a real
`super`; or extend `prepend()` to accept a missing base method (a no-op root),
so the chain can be prepended in include order. Then `model.ts` carries no
`initInternals` / `initializeDup` body at all, exactly as `model.rb` carries
none, and each module's exported hook opens with its `super` call.

## Acceptance criteria

- `Model#initInternals` and `Model#initializeDup` are gone from `model.ts`;
  the behaviour comes from `include()`ing the Validations and Dirty modules in
  Rails' include order.
- Each module's hook calls its own `super` (however activesupport spells it)
  first, matching the Ruby bodies cited above; no body is inlined or reordered.
- `packages/activemodel/src` non-test `.call(this` count drops from 13 to 9.
- activemodel and activerecord suites pass unchanged; no test renamed.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `:args` clean with no reseed.
