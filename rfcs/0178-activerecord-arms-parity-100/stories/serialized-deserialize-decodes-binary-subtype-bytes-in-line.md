---
title: "activerecord: Serialized#deserialize decodes binary subtype bytes in line"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Type::Serialized#deserialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:17-23`) is

```ruby
if default_value?(value)
  value
else
  coder.load(super)
end
```

trails' port (`packages/activerecord/src/type/serialized.ts#deserialize`) takes one more arm: when the
subtype is `binary` and `super` answered a `Uint8Array`, it decodes the bytes to a UTF-8 string before
handing them to `coder.load`. Rails needs no such arm because a binary column's deserialized value is a
Ruby `String`, which `YAMLColumn#load` / `JSON#load` read directly
(`vendor/rails/v8.0.2/activerecord/lib/active_record/coders/yaml_column.rb`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/coders/json.rb`).

The arm also reaches for the Node global `Buffer`.

The receipt on the declaration is
`@inventedArm if — CONVERGEABLE serialized-deserialize-decodes-binary-subtype-bytes-in-line`.

## Acceptance criteria

- [ ] `Serialized#deserialize` is `if default_value?(value) value else coder.load(super) end`, with no
      subtype or `Uint8Array` test in the body.
- [ ] The bytes-to-string step lives where the bytes are produced or consumed (the binary type's
      `deserialize`, or the coders' `load`), decided from what the SQLite / PostgreSQL / MySQL drivers
      hand back for a BLOB / bytea column, and uses no Node global.
- [ ] `serialized-attribute.test.ts` binary-column cases stay green on all three adapters.
- [ ] The `@inventedArm` receipt is deleted and `pnpm parity:api:arms:throws` is green.
