---
title: "LazilyDefineAttributes is a plain class, not Rails' lazy Module (no included/define_on/==)"
status: in-progress
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 13
pr: 7187
claim: "2026-08-28T21:25:34Z"
assignee: "rehome-store-and-store-accessor-as-class-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `LazilyDefineAttributes#matches?` under PR #7173
(the nested-class population fix made these bodies measurable for the first
time). `matches?` itself is converged; the surrounding class is not.

Rails (`activemodel/lib/active_model/validations/acceptance.rb:27-77`):

- `class LazilyDefineAttributes < Module` — it IS a module, constructed per
  validator and `include`d into the model by `setup!`
  (`acceptance.rb:19-21`), which is what makes the definition lazy.
- `included(klass)` (`:33-49`) installs `respond_to_missing?` and
  `method_missing` under a `Mutex`, both of which call `define_on(klass)`
  first and then consult `matches?`.
- `define_on(klass)` (`:56-69`) synchronizes, `reject`s names the class
  already answers via `attribute_method?`, calls `attr_reader` / `attr_writer`
  for the rest, then `remove_method`s the two `method_missing` hooks and nils
  the lock so it runs exactly once.
- `==(other)` (`:71-73`) compares class and attributes — this is what
  `klass.included_modules.include?(define_attributes)` in `setup!` relies on.
- `attributes` is a `protected attr_reader` (`:75-76`).

trails (`packages/activemodel/src/validations/acceptance.ts:7-27`) has a plain
class with a public `readonly attributes`, no `included`, no `define_on`, no
`==`, and two methods Rails does not have at all: `include(attribute)` and
`define(attribute)`. The laziness is gone — `setupBang` (`:30-51`) walks
`this.attributes` and `Object.defineProperty`s a getter/setter pair onto the
prototype eagerly at validator construction, where Rails defers until the
first missing-method hit and then removes the hooks.

`static readonly lazilyDefineAttributes = new LazilyDefineAttributes([])` and
`static setup(attributes)` (`:54`, `:74-76`) are also unmatched surface.

## Acceptance criteria

- Port `included`, `define_on`, and `==` with Rails' names and control flow,
  including the reject-what-the-class-already-answers arm and the one-shot
  hook removal. JS has no `method_missing`, so the settled trails idiom for
  that seam is what decides the shape — find it rather than inventing one.
- Delete `include` and `define`, or fold them into the ported bodies. Do not
  leave them with a `@noRailsEquivalent` unless a genuine TS shortcoming
  forces them, in which case cite it at the call site.
- `attributes` becomes non-public surface, matching Rails' `protected`.
- Keep `matches?` as converged in #7173 (chomps one trailing `=`, returns a
  boolean).
- `pnpm parity:api:extra --package activemodel` shows no new novel names, and
  the acceptance validation suite stays green.
