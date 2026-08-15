---
title: "Model.modelName detects use_relative_model_naming? like Rails"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Naming#model_name` (naming.rb:271-276) picks the namespace it
passes to `Name.new` by walking the class's module parents:

    namespace = module_parents.detect do |n|
      n.respond_to?(:use_relative_model_naming?) && n.use_relative_model_naming?
    end
    ActiveModel::Name.new(self, namespace)

That argument is the only thing that selects the prefix-dropped
`param_key` / `route_key` shape (naming.rb:171, :180-182).

PR #6572 taught `ModelName` the distinction: a namespace passed as
`{ name, useRelativeModelNaming: true }` gets the isolated shape, a string or
segment array gets the shared one. What is still missing is the _detection_ —
`Model.modelName` (`packages/activemodel/src/model.ts:1531-1537`) and
`Serializers::JSON`'s copy (`packages/activemodel/src/serializers/json.ts:144-150`)
always build the namespace from `this.moduleName?.split("::")`, i.e. always a
plain string array. So no model class in trails can produce the isolated shape;
it is reachable only by constructing a `ModelName` by hand in a test.

This is latent rather than wrong today — trails has no engine /
`isolate_namespace` concept, and Rails' own default for a plain namespaced
class is the shared shape, which is what `Model.modelName` now produces. It
becomes wrong the moment trails grows engines.

## Converged shape

`Model.modelName` mirrors naming.rb:271-276: consult the enclosing namespace
for `use_relative_model_naming?` (Rails' spelling, `useRelativeModelNaming` per
docs/ruby-ts-conventions.md) and pass the object form of the namespace when it
answers truthily, the segment array otherwise. `Serializers::JSON.modelName`
does the same — the two are copies of one Rails method and must not drift.

## Acceptance criteria

- A model whose namespace declares relative model naming gets
  `paramKey` / `routeKey` without the prefix; one that does not keeps it.
- `Model.modelName` and `Serializers::JSON.modelName` derive the namespace
  identically.
- No new rows in any parity baseline.
