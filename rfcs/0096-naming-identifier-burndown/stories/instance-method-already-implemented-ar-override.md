---
title: "Give ActiveRecord its own instance_method_already_implemented? instead of inlining an arm in ActiveModel"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6711
claim: "2026-08-18T18:27:43Z"
assignee: "retire-relation-is-named-join-value-discriminator"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-methods.ts#defineAttributeMethodPattern`
guards with two arms where Rails has one:

```ts
if (
  isInstanceMethodAlreadyImplemented.call(this, publicMethodName) ||
  this.prototype[publicMethodName] !== undefined
) {
  if (!override) return;
}
```

Rails (`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:326`)
calls `instance_method_already_implemented?(public_method_name)` and nothing
else. The predicate is a template method with two implementations:

- ActiveModel (`attribute_methods.rb:404-406`):
  `generated_attribute_methods.method_defined?(method_name)`.
- ActiveRecord (`vendor/rails/activerecord/lib/active_record/attribute_methods.rb`,
  `instance_method_already_implemented?`) — overrides it to also raise
  `DangerousAttributeError` for a name ActiveRecord itself defines, and to
  consult `defined_within` / the class's own methods.

trails has a single `AttributeMethodHost` interface serving both packages, so
the AR arm was inlined at the ActiveModel call site as a bare
`this.prototype[name] !== undefined` check. That is neither implementation:
it never raises `DangerousAttributeError`, and it rejects any inherited
prototype method rather than only the dangerous ones.

Surfaced while threading `CodeGenerator` through `define_attribute_method`
(PR #6538, RFC 0096).

## Converged shape

`isInstanceMethodAlreadyImplemented` becomes the overridable template method
Rails makes it: the activemodel definition stays
`generatedAttributeMethods.call(this).isMethodDefined(methodName)`, and
`packages/activerecord/src/attribute-methods.ts` supplies its own, assigned to
the AR model host the same way the other `this`-typed class methods are.
`defineAttributeMethodPattern` then calls the predicate only.

## Acceptance criteria

- [ ] `defineAttributeMethodPattern`'s guard is a single
      `isInstanceMethodAlreadyImplemented` call, per attribute_methods.rb:326.
- [ ] An ActiveRecord-side `isInstanceMethodAlreadyImplemented` exists under
      the Rails name and carries the AR behaviour, including
      `DangerousAttributeError`.
- [ ] A test covers a dangerous attribute name raising, and one covers an
      ordinary class-body method still not being overridden.
- [ ] `pnpm parity:api:extra --package activerecord` gains no novel name.
