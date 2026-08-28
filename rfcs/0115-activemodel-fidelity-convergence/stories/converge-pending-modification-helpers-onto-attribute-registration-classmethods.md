---
title: "Converge attribute-registration's cls-first helpers onto ClassMethods"
status: done
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7142
claim: "2026-08-28T00:36:52Z"
assignee: "converge-pending-modification-helpers-onto-attribute-registration-classmethods"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:53-99` puts
`apply_pending_attribute_modifications(attribute_set)` (:81-89) and
`reset_default_attributes` (:91-94) inside `ClassMethods`, under `private` — so
they are class methods on every includer and Rails self-sends them
(`_default_attributes` at :31-35 calls `apply_pending_attribute_modifications`;
`attribute` at :12-21 calls `reset_default_attributes`).

`packages/activemodel/src/attribute-registration.ts:326` and `:353` port both as
free functions whose FIRST PARAMETER is the class —
`applyPendingAttributeModifications(cls, attributeSet)` and
`resetDefaultAttributes(cls)` — rather than `this`-typed functions the way their
siblings in the same file are (`pendingAttributeModifications`,
`resetDefaultAttributesBang`, `resolveAttributeName`, `hookAttributeType` all
take `this: AttributeHostInternals`).

PR #7124 added the `ClassMethods` module object at
`attribute-registration.ts` that `Attributes.[included]` extends onto its host
(attribute_registration.rb:11). These two are the ONLY members of Ruby's
`ClassMethods` that could not be listed in it, because a `cls`-first free
function is not installable as a method. So the host does not answer
`apply_pending_attribute_modifications` / `reset_default_attributes` at all,
where every Ruby includer does.

`applyPendingAttributeModifications` also open-codes Rails' `super` walk with
`Object.getPrototypeOf(cls)` plus a `typeof superclass._defaultAttributes ===
"function"` duck-test, standing in for :82's
`superclass.respond_to?(:apply_pending_attribute_modifications, true)` — a test
that becomes a plain `respond_to?` equivalent once the method is a real class
method.

## Converged shape

- Both take `this: AttributeHostInternals` and self-send, matching their
  siblings in the file.
- Both join the `ClassMethods` export, so `extend(base, ClassMethods)` installs
  the whole of attribute_registration.rb:11-115 as Ruby does.
- `applyPendingAttributeModifications`' superclass guard tests for the method
  itself (attribute_registration.rb:82), not for `_defaultAttributes`.
- Call sites in `_defaultAttributes` (:206) and `attribute` (:115) become
  self-sends.

## Acceptance criteria

- `AttributeRegistration::ClassMethods` in `attribute-registration.ts` lists
  every member attribute_registration.rb:11-115 declares.
- Neither helper takes a class as its first parameter.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; `pnpm parity:api:extra --package activemodel` shows no new novel rows.
