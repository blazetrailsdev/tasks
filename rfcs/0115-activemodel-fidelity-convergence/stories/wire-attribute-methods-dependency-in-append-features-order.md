---
title: "Wire the AttributeMethods dependency in append_features order"
status: ready
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/concern.rb:135-138` fixes the
order every Concern's inclusion follows:

    @_dependencies.each { |dep| base.include(dep) }   # :135
    super                                             # :136 — own instance methods
    base.extend const_get(:ClassMethods)              # :137
    base.class_eval(&@_included_block)                # :138

PR #7124 made `Attributes.[included]`
(`packages/activemodel/src/attributes.ts:228-258`) follow that for the module's
OWN halves. The `@_dependencies` at :135 are still wired in the wrong internal
order for one of the two:

    extend(base, AttributeRegistrationClassMethods);   // dep 1 — correct, no instance half
    extend(base, AttributeMethodsClassMethods);        // dep 2 — :137 BEFORE :136
    include(base, AttributeMethodsInstanceMethods);    // dep 2 — :136 AND :138 together

`base.include(AttributeMethods)` at :135 recurses into the same
`append_features`, so `AttributeMethods`' own instance methods (:136) must land
BEFORE its `ClassMethods` extend (:137), and its `included do`
(`attribute_methods.rb:70-73`, the two `class_attribute` calls) must land AFTER
it (:138).

It cannot be spelled that way today because
`packages/activemodel/src/attribute-methods.ts:629` exports `InstanceMethods`
as ONE plain-object module carrying the `included do` on its `[included]` hook,
so `include(base, InstanceMethods)` performs :136 and :138 in a single
statement with no seam for the :137 extend. The current order was carried
verbatim from `model.ts` when #7124 moved the wiring into the hook, and it is
harmless today only because nothing in the two `class_attribute` calls reads a
`ClassMethods` member.

Related: `group-attribute-methods-into-classmethods-instancemethods-modules`
(RFC 0115) reshapes that same module pair and is the natural place to open the
seam; this story is the ordering fix that reshape enables. Check whether it
should merge into that one before claiming.

## Converged shape

`Attributes.[included]` wires each dependency through one call that recurses
into `append_features`' full order, or — if the halves stay separate —
`include(base, AttributeMethodsInstanceMethods)` (:136) precedes
`extend(base, AttributeMethodsClassMethods)` (:137), with the `included do`
(:138) issued after the extend rather than riding the instance-half include.

## Acceptance criteria

- `Attributes.[included]`'s dependency block matches concern.rb:135-138's order
  for BOTH `attributes.rb:32` and `:33`.
- The `resolve_attribute_name` precedence attribute_methods.rb:396-398 wins over
  attribute_registration.rb:101-103 is preserved (a test pins it).
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; no new novel rows in `pnpm parity:api:extra --package activemodel`.
