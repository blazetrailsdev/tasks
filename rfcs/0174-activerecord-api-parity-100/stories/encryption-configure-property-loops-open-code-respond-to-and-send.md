---
title: "Encryption::Configurable.configure open-codes its two respond_to?/send property loops"
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

`Configurable.configure` applies each extra property with a `respond_to?` guard and a `send`:

```ruby
# vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/configurable.rb:29-37
properties.each do |name, value|
  ActiveRecord::Encryption.config.send "#{name}=", value if ActiveRecord::Encryption.config.respond_to?("#{name}=")
end

ActiveRecord::Encryption.reset_default_context

properties.each do |name, value|
  ActiveRecord::Encryption.context.send "#{name}=", value if ActiveRecord::Encryption.context.respond_to?("#{name}=")
end
```

trails' `packages/activerecord/src/encryption/configurable.ts:60-86` open-codes both loops:

- the config loop probes a `set${Key}` method, then falls back to `key in config` and a bare
  property write;
- the context loop guards on `Context.PROPERTIES.includes(key)` and does a bare property write;
- both skip `primaryKey` / `deterministicKey` / `keyDerivationSalt` and any `undefined` value, arms
  Rails does not have (those three are named kwargs, so they are never in `properties`).

trails#8312 made `Context`'s `attr_accessor(*PROPERTIES)` (`context.rb:15`) real accessors and ported
`Contexts.with_encryption_context`'s `send("#{key}=", value)` as `rbFSend` (`contexts.ts`), so the
context loop can now be the Rails line: an `rbObjRespondTo` guard on the `name=` writer around an
`rbFSend` of that same writer. The config loop needs `Config`'s writers
(`encryption/config.rb`) to answer `name=` the same way — check which are fields and which are
`setX` methods in `packages/activerecord/src/encryption/config.ts` first; `rbFSend` answers `name=`
from a setter or a `name=` method, not from a data property.

## Acceptance criteria

- [ ] Both `properties.each` loops in `configure` are `rbObjRespondTo` + `rbFSend` on `Encryption.config` / `Encryption.context`, with no `PROPERTIES.includes` guard, no `set${Key}` probe and no `key in config` fallback.
- [ ] The named kwargs are destructured out of `properties` as Rails' signature does, so the per-iteration `primaryKey` / `deterministicKey` / `keyDerivationSalt` skips go away.
- [ ] A property neither object has a writer for is skipped silently (Rails' `respond_to?` arm), covered by a test in `configurable.trails.test.ts`.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` stay green; any `configurable.ts` baseline row this converges is deleted by hand and the mark tightened.
