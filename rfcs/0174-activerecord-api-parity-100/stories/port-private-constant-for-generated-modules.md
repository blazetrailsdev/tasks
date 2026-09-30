---
title: "port-private-constant-for-generated-modules"
status: draft
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
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

Rails marks both per-model generated modules private right after naming them:

- `private_constant :GeneratedAttributeMethods` —
  `vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:44`
  (trails: `initializeGeneratedModules`, `packages/activerecord/src/attribute-methods.ts`).
- `private_constant :GeneratedRelationMethods` —
  `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:65`
  (trails: `DelegateCache.generatedRelationMethods`, `packages/activerecord/src/relation/delegation.ts`).

trails binds both through ruby-compat's `rbModConstSet` (Module#const_set) but
omits the `private_constant` statement. In MRI 3.3.11 a private constant is
still returned by `const_get` (`Object.const_get("Topic::M")` answers it); it
is hidden only from lexical `Topic::M` references (NameError "private constant
… referenced") and from `Module#constants` (`rb_local_constants_i`,
`vendor/ruby/v3.3.11/variable.c:3373-3379`). trails has neither reader today,
so a side-table port (`rb_mod_private_constant`, `variable.c:3852`) would have
no observer.

The omission cannot be receipted at the call site: `private_constant` is not in
parity's compared call set, so `@missingRailsCall private_constant — …` reds
`pnpm parity:api:calls` with "1 STALE @missingRailsCall tag(s) whose call is no
longer flagged", and `blazetrails/no-freeform-comments` strips prose. This
story is the ledger row (PR trails#8307).

## Acceptance criteria

- [ ] ruby-compat ports `Module#private_constant` (`rb_mod_private_constant`)
      together with a reader that observes it — `Module#constants`
      (`rb_mod_constants`) — each with its MRI citation.
- [ ] `initializeGeneratedModules` and `generatedRelationMethods` call it,
      one TS statement per Ruby statement.
- [ ] A test shows the generated module absent from the owner's constants
      listing.
