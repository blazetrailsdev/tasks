---
title: "LogSubscriber#render_bind duck-types its bind instead of Rails' three-arm case"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8335, which made `ActiveModel::Attribute#value` a method and had to touch this body.

Rails' `ActiveRecord::LogSubscriber#render_bind`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/log_subscriber.rb:65-79`):

```ruby
def render_bind(attr, value)
  case attr
  when ActiveModel::Attribute
    if attr.type.binary? && attr.value
      value = "<#{attr.value_for_database.to_s.bytesize} bytes of binary data>"
    end
  when Array
    attr = attr.first
  else
    attr = nil
  end

  [attr&.name, value]
end
```

trails' `renderBind` (`packages/activerecord/src/log-subscriber.ts`) goes through an invented
private helper, `resolveBindAttribute`, that also admits any object carrying `type` and `value`
keys, and then:

- probes `resolved.type?.isBinary?.() ?? resolved.type?.binary?.()` where Rails calls
  `attr.type.binary?`;
- calls `resolved.value?.()` and falls back to `byteLength(raw ?? resolved.value?.())`, where Rails
  measures `attr.value_for_database.to_s.bytesize` only;
- in the `Array` arm and the final arm, reads `.name` off any object with a string `name`, where
  Rails' `else` arm sets `attr = nil`.

The duck arm exists for two test doubles: `log-subscriber.test.ts` "binary data is not logged" and
"binary data hash" pass `{ name, type: { binary }, value, valueForDatabase }` literals. Rails'
tests (`activerecord/test/cases/log_subscriber_test.rb`) create a `Binary` record.

Same class of leftover, one file over: `InstanceLockingHost` in
`packages/activerecord/src/locking/optimistic.ts` types `_attributes.getAttribute()` as
`{ value: unknown; valueBeforeTypeCast: unknown; … }`, a hand-written structural copy of
`Attribute` that still spells `value` as a property.

## Converged shape

`renderBind` is the three-arm `case`: `attr instanceof Attribute`, `Array.isArray(attr)`, else
`null`, with `attr.type.isBinary()`, `attr.value()` under Ruby truthiness, and
`attr.valueForDatabase`. `resolveBindAttribute` is deleted.

## Acceptance criteria

- [ ] `renderBind` has Rails' three arms and no `resolveBindAttribute`.
- [ ] The two binary tests build their bind from a real `Attribute` (or a `Binary` record through
      `fixtures({...})`), keeping their Rails names.
- [ ] `InstanceLockingHost` reads `AttributeSet` / `Attribute` types instead of a structural copy.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay green.
