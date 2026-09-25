---
title: "Delegation#respond_to_missing? carries an invented own-property walk instead of super || model.respond_to?"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8103
claim: "2026-09-25T19:20:45Z"
assignee: "trails-actions-insert-at-marker-instead-of-rails-sentinel"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:152-154` is:

    def respond_to_missing?(method, _)
      super || model.respond_to?(method)
    end

trails' `Delegation#respondToMissing` (`packages/activerecord/src/relation/delegation.ts`) has two branches Rails lacks:

- a `typeof model.respondTo === "function"` branch;
- an own-property walk of the model's constructor chain that stops at `Function.prototype` and answers `typeof model[method] === "function"`.

trails#8083 added only the final fall-through to `model.respondToMissing(method)`, so dynamic finders answer. The walk exists so that non-function static data fields and `Function.prototype` members (`call` / `apply` / `bind`, pinned by `relation/delegation.trails.test.ts` "does not answer Function.prototype members Ruby's Module never defines") are not reported as methods. A plain `rbObjRespondTo(model, method)` would report them.

## Converged shape

`return rbObjRespondTo(model, method)`, the port of `model.respond_to?(method)`, once `basicObjRespondTo` / `rbObjRespondTo` answer a class receiver the way Ruby's `Module#respond_to?` does. That means excluding `Function.prototype` members and non-method static data, which puts the rule in ruby-compat rather than in this body.

## Acceptance criteria

- `Delegation#respondToMissing`'s body is `super || model.respond_to?(method)` (super being `false` for Object) with no own-property loop.
- The existing delegation trails tests stay green.
