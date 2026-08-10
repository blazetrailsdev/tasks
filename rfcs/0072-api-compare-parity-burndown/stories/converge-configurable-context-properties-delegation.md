---
title: "Configurable delegates only 3 of Context::PROPERTIES' 6 readers"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6114
claim: "2026-08-05T02:30:05Z"
assignee: "refresh-stale-eslint-exclude-baselines"
blocked-by: null
closed-reason: null
---

## Context

Rails generates a reader on `Configurable` for every `Context::PROPERTIES`
member:

```ruby
# activerecord/lib/active_record/encryption/configurable.rb:16-19
Context::PROPERTIES.each do |name|
  delegate name, to: :context
end
```

`PROPERTIES` is `%i[ key_provider key_generator cipher message_serializer
encryptor frozen_encryption ]` (context.rb:13).

trails hand-writes only three of the six on
`packages/activerecord/src/encryption/configurable.ts`:
`keyProvider` (:41-43), `cipher` (:45-47), `encryptor` (:49-51). The other
three — `keyGenerator`, `messageSerializer`, `frozenEncryption` — have no
reader at all, so `ActiveRecord::Encryption.key_generator` and friends are
unreachable through the facade and callers reach into `Contexts.context`
directly instead.

Surfaced in #6108, which ported `Context.PROPERTIES` (context.ts) as the real
Rails constant in order to drive `configure`'s second `properties.each`
(configurable.rb:35-37). The constant that would drive this delegation is now
present, which is what makes the gap cheap to close.

## Converged shape

Generate all six readers off `Context.PROPERTIES` rather than hand-writing a
subset, so the set cannot drift from the constant again. `cipher`'s existing
body also carries a `_defaultCipher` fallback that Rails does not have
(configurable.rb has no such default) — check whether that survives the
conversion or is itself a deviation to fold in.

## Acceptance criteria

- [ ] All six `Context::PROPERTIES` members have a reader on `Configurable`.
- [ ] The readers derive from `Context.PROPERTIES`, not a hand-maintained list.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra --package activerecord` do not regress.
