---
title: "Image Ruby `+` over arrays as a concatenation, not a JS `+`"
status: closed
est_loc: 120
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`INFIX` in `scripts/prism-codegen/handlers/expressions.ts:17-31` maps Ruby `+`
unconditionally to `ts.SyntaxKind.PlusToken`. Ruby's `Array#+` concatenates
elements; JS `+` between two arrays coerces both to strings, so
`relation.rb:65`'s

    VALUE_METHODS = MULTI_VALUE_METHODS + SINGLE_VALUE_METHODS + CLAUSE_METHODS

emits as `MULTI_VALUE_METHODS + SINGLE_VALUE_METHODS + CLAUSE_METHODS`, which is
the string `"includes,eager_load,...where,having,from"`, not the 27-element
array Rails iterates at `relation/query_methods.rb`'s
`Relation::VALUE_METHODS.each`.

`unportedMacro` in `scripts/prism-codegen/handlers/structure.ts` currently keeps
any class-body statement containing a `+` on a constant out of the emitted
output rather than shipping the wrong image. That exclusion is the placeholder
this story removes.

The settled shape is the one `INFIX_HELPER`
(`handlers/expressions.ts:33-37`) already uses for `<=>` / `|` / `&`: an
operator with no JS counterpart, or more than one family of meaning, is imaged
as a runtime helper rather than a JS operator. `+` is a three-family operator —
numeric addition, `String#+`, `Array#+` — and needs the same treatment.

Filed out of PR #6111, which reached this line for the first time by emitting
class-body macro statements at all.

## Acceptance criteria

- [ ] Ruby `+` over arrays emits a concatenation, not a JS `+`.
- [ ] `VALUE_METHODS` in `relation.js.snap` emits with all 27 elements.
- [ ] The `+`-on-a-constant arm of `unportedMacro` (`handlers/structure.ts`) is
      deleted, and the `codegen-array-infix-plus` reference in its JSDoc with it.
- [ ] Numeric and `String#+` uses still emit as JS `+`.
- [ ] 0 parse errors invariant holds.
