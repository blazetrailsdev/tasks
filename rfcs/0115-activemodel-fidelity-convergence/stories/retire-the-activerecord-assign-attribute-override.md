---
title: "Retire ActiveRecord's second _assign_attribute and send Rails' one to self"
status: done
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6801
claim: "2026-08-21T01:13:06Z"
assignee: "converge-model-name-match-raise-onto-string-match"
blocked-by: null
closed-reason: null
---

## Context

Rails has exactly one `_assign_attribute`, ActiveModel's
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:67-75`):

```ruby
def _assign_attribute(k, v)
  setter = :"#{k}="
  public_send(setter, v)
rescue NoMethodError
  respond_to?(setter) ? raise : attribute_writer_missing(k.to_s, v)
end
```

ActiveRecord overrides only `_assign_attributes`
(`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb:6-23`) and
calls that one `_assign_attribute` on self.

trails has a second one: `_assignAttribute(self, key, value)` in
`packages/activerecord/src/persistence.ts` (module-private until #6791 exported
it), which resolves nested-attribute setters and association writers before
falling back to a prototype setter, and returns `Promise<void> | void`. Rails'
version does none of that — the association writers ARE the `#{name}=` methods
`public_send` reaches, and RFC 0087 removed the generated property setters for
the ones that owe I/O, which is why the dispatch has to find them by
association name here.

Because it is a plain function rather than a method, ActiveRecord's
`_assign_attributes`
(`packages/activerecord/src/attribute-assignment.ts`) imports it from
`persistence.ts` and calls it directly instead of sending to self, so a
subclass override would not be honoured. It also sits in `persistence.ts`,
whose Rails counterpart (`persistence.rb`) has no such method — its Rails home
is `attribute_assignment.rb`.

## Converged shape

One `_assign_attribute`, ActiveModel's, reached through `this`. The
association-writer and nested-attribute arms fold into the setter lookup so the
ladder is Rails' `public_send(setter, v)` with a `respond_to?` fallback — see
the already-done `converge-assign-attribute-writer-ladder-onto-public-send` for
the ladder shape, and RFC 0087 for why the awaitable writers cannot be property
setters.

If the AR-side dispatch genuinely cannot collapse, it belongs in
`activerecord/src/attribute-assignment.ts` at the Rails name and is reached via
`this`, not via a cross-file import of a `persistence.ts` function.

## Acceptance criteria

- `packages/activerecord/src/persistence.ts` no longer defines or exports
  `_assignAttribute`.
- ActiveRecord's `_assign_attributes` sends `_assign_attribute` to `this`, as
  `attribute_assignment.rb:17` does.
- `pnpm parity:api:extra --package activerecord` shows no new novel name;
  nested-attribute, association-writer and multiparameter assignment coverage
  stays green (`nested-attributes*.test.ts`, `has-one-associations.test.ts`,
  `multiparameter-attributes.test.ts`).
