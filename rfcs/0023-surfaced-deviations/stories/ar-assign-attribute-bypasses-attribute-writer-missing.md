---
title: "AR _assignAttribute bypasses attribute_writer_missing and the respond_to? re-raise arm"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: persistence.ts:1004 _assignAttribute now calls self.attributeWriterMissing(key, value) on the no-setter arm (attribute_assignment.rb:71-74)."
---

## Context

Surfaced while converging `#update` / `#update!` onto `setAttributes` in PR 6204 (`route-awaitable-callers-through-set-attributes`), which removed
`_assignAttribute`'s non-Rails `AttributeAssignmentError` wrap and left the
method's remaining branch structure visible.

Rails' `_assign_attribute`
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:67-75`) is:

```ruby
def _assign_attribute(k, v)
  setter = :"#{k}="
  public_send(setter, v)
rescue NoMethodError
  if respond_to?(setter)
    raise
  else
    attribute_writer_missing(k.to_s, v)
  end
end
```

Two things happen there that the port does not do. A `NoMethodError` raised
_inside_ a real setter is re-raised untouched (the `respond_to?(setter)` arm),
and a genuinely absent setter routes to the overridable
`attribute_writer_missing` hook (`:55-57`), whose default raises
`UnknownAttributeError`.

`packages/activerecord/src/persistence.ts`'s `_assignAttribute` instead falls
straight to `self.writeAttribute(key, value)` when `findPrototypeSetter` misses:

```ts
const setter = findPrototypeSetter(self, key);
if (setter) {
  const result: unknown = setter.call(self, value);
  if (result instanceof Promise) return result as Promise<void>;
} else {
  self.writeAttribute(key, value);
}
```

So the hook is bypassed on the ActiveRecord mass-assignment path even though
trails _has_ ported it — `attributeWriterMissing` exists at
`packages/activemodel/src/model.ts:2493` and `model.ts:1636` already routes to
it from the ActiveModel side. A model overriding `attributeWriterMissing` (the
documented Rails extension point, `attribute_assignment.rb:39-54`) is silently
ignored by `assignAttributes` / `setAttributes` / `update` on an AR model, and
the writer-raises-NoMethodError case is not distinguished from the
no-such-writer case at all.

## Converged shape

`_assignAttribute` dispatches through the setter and, when there is none, calls
`(self as any).attributeWriterMissing(key, value)` rather than
`writeAttribute` — matching `attribute_assignment.rb:71-74`. Note the plain-column
path must keep working: in trails a plain column has no prototype setter, so the
`writeAttribute` fallback cannot simply be replaced wholesale. Establish first
whether a declared column is reachable via `findPrototypeSetter` (`model-schema.ts:1475`
defines per-column accessors) and, if not, keep `writeAttribute` for known
attributes and route only genuinely-unknown keys to the hook, which is what
Rails' `respond_to?` split effectively expresses.

## Acceptance criteria

- [ ] An unknown key on an AR model reaches `attributeWriterMissing`
      (`attribute_assignment.rb:73`), so a model overriding it is honoured by
      `assignAttributes` / `setAttributes` / `update`.
- [ ] A test proves the override is honoured, and a second proves the default
      still raises `UnknownAttributeError` (no test renames).
- [ ] Known columns still assign, and existing error classes are unchanged —
      the raw-propagation behaviour PR 6204 landed must not regress.
