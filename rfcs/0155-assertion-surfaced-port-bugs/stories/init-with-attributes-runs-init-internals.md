---
title: "init-with-attributes-runs-init-internals"
status: done
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8254
claim: "2026-09-29T23:58:44Z"
assignee: "psych-object-protocol-for-record-yaml-round-trip"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Core#init_with_attributes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:508-520`) sets
`@new_record` / `@attributes`, then runs `init_internals`, yields, and runs
`_run_find_callbacks` / `_run_initialize_callbacks`. Every Rails path that
builds a record from existing attributes goes through it:
`Persistence.instantiate_instance_of` (`persistence.rb:311-314`,
`klass.allocate.init_with_attributes`), `Core#init_with` (`core.rb:498-502`),
`Marshalling#marshal_load` and `ActiveRecord::MessagePack`
(`message_pack.rb:108`).

trails' `initWithAttributes` (`packages/activerecord/src/core.ts`) only
assigns `_newRecord` / `_attributes` and yields. `init_internals` cannot simply
be added, because trails' `Core.initInternals` also carries `initialize`'s
`@new_record = true` / `@attributes = _default_attributes.deep_dup`
(`core.rb:437-449`), so it would clobber the attributes just assigned.
`Base._instantiate` compensates inline (it constructs through `Base.allocate`,
runs `changesApplied`, and the find/initialize callbacks itself), but
`Core#initWith` (the Psych revive path) and `marshalLoad` get none of it.
`parity:api:calls` reports the omission as
`activerecord core.ts init_with_attributes init_internals`, carried as
`@missingRailsCall init_internals — CONVERGEABLE` on `initWithAttributes`.

## Acceptance criteria

- [ ] `initialize`'s two assignments move out of `Core.initInternals` into
      the constructor path, as in `core.rb:437-449`.
- [ ] `initWithAttributes` runs `initInternals`, yields, and runs the find /
      initialize callbacks, as `core.rb:508-520` does; `_instantiate` becomes
      `instantiate_instance_of`'s `klass.allocate.init_with_attributes`.
- [ ] The `@missingRailsCall init_internals — CONVERGEABLE` tag is removed.
