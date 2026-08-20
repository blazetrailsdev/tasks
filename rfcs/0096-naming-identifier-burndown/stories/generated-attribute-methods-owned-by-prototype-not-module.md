---
title: "Dirty/attribute accessors are generated onto the class prototype, not into GeneratedAttributeMethods"
status: done
updated: 2026-08-20
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6761
claim: "2026-08-20T03:52:32Z"
assignee: "port-with-connection-acquisition-seam-for-the-arel-reader"
blocked-by: null
closed-reason: null
---

# Dirty/attribute accessors are generated onto the class prototype, not into GeneratedAttributeMethods

## Context

Surfaced in PR #6720 while restoring the `superclass != Base` arm of
`instance_method_already_implemented?`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:165-179`),
whose whole point is:

```ruby
defined = method_defined_within?(method_name, superclass, Base) &&
  ! superclass.instance_method(method_name).owner.is_a?(GeneratedAttributeMethods)
```

Rails puts every generated attribute method into the per-class
`GeneratedAttributeMethods` module (`attribute_methods.rb:14`, included at
`:35-40`), so `owner.is_a?(GeneratedAttributeMethods)` cleanly separates
"generated, regenerate it on the subclass" from "hand-written, leave it alone".

trails only partly does this. The ActiveModel pipeline
(`packages/activemodel/src/attribute-methods.ts`,
`CodeGenerator.batch(generatedAttributeMethods.call(this), …)` ->
`MethodSet#apply` -> `owner.moduleEval`) does write into the module — which is
why `alias_attribute`-generated methods have a module owner. But the dirty and
per-attribute accessors are installed **directly onto the class prototype** by
`defineDirtyAttributeMethods(proto, name)` at
`packages/activerecord/src/model-schema.ts:1209`, bypassing the module
entirely. Measured on the PR branch for a model with `attribute("name")`:

```js
Object.getOwnPropertyNames(Middle.prototype);
// ['constructor', 'name', 'nameChanged', 'nameChange', 'nameWas', …]
Middle._generatedAttributeMethods.instanceMethods(); // []
```

So `nameChanged` and friends are indistinguishable from a hand-written
class-body method by any owner test, and the owner arm shipped in #6720 is
only effective for the `alias_attribute` path. An inherited GENERATED dirty
accessor still suppresses the subclass's own generation, which is the defect
that arm exists to prevent — it is narrowed, not closed.

The bare-reader early return in `defineAttributeMethodPattern`
(`packages/activemodel/src/attribute-methods.ts`, the `pattern.prefix === "" &&
pattern.suffix === ""` branch) is the same shape for the plain reader: trails
exposes it as a real accessor property from `attribute()` rather than a
generated method.

## Converged shape

Route the dirty / per-attribute accessor generation through the same
`CodeGenerator` + `generatedAttributeMethods` module the rest of the pipeline
uses, so the generated module is the owner of every generated method and the
prototype carries only class-body methods — as in Rails, where the module sits
below the class in the ancestry and a class-body method therefore still wins
lookup.

Once that holds, `isOwnedByGeneratedAttributeMethods`
(`packages/activerecord/src/attribute-methods.ts`, added in #6720) answers
correctly for every generated name, not just aliases.

Check `undefine_attribute_methods` (`attribute_methods.rb`) still clears
everything it should afterwards — it undefines the module's methods, which is
currently a no-op for the prototype-installed ones.

## Acceptance criteria

- [ ] Dirty and per-attribute generated methods are owned by the class's
      `GeneratedAttributeMethods` module, not by the class prototype.
- [ ] A test covers an inherited GENERATED dirty accessor (e.g. `nameChanged`)
      NOT suppressing the subclass's own generation — failing on the baseline.
      #6720's alias-based test stays green.
- [ ] A class-body method still outranks the generated one of the same name
      (the existing "an ordinary class-body method is not overridden by a
      generated attribute method" test in
      `packages/activerecord/src/attribute-methods.trails.test.ts`).
- [ ] `undefineAttributeMethods` clears the newly-module-owned methods.
- [ ] `parity:api:calls` / `:args` clean; `parity:api:extra --package activerecord`
      gains no novel name; `parity:api` / `parity:test` deltas non-negative.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
