---
title: "Serialized#cast should serialize-first like Rails Mutable#cast"
status: in-progress
updated: 2026-07-07
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 53
pr: 4738
claim: "2026-07-07T14:25:51Z"
assignee: "serialized-cast-mutable-serialize-first"
blocked-by: null
---

## Context

`packages/activerecord/src/type/serialized.ts` `cast()` shortcut:

```ts
const preEncoded =
  value === null || value === undefined || (typeof value === "string" && !this.subtype.isBinary());
if (preEncoded) {
  return this.deserialize(value); // ← shortcut: calls coder.load directly
}
return this.deserialize(this.serialize(value));
```

Rails `ActiveModel::Type::Helpers::Mutable#cast`:

```ruby
def cast(value)
  deserialize(serialize(value))   # always serialize-first
end
```

Rails always does `deserialize(serialize(value))`. For a non-Hash/non-HWIA string like `"somedata"`, `serialize` calls `IndifferentCoder#dump(as_regular_hash("somedata"))` = `IndifferentCoder#dump({})` = `"{}"`. Then `deserialize("{}")` returns an empty HWIA cleanly. Our shortcut sends `"somedata"` directly to `coder.load`, which raises on `JSON.parse`.

This caused `store_test.rb` "convert store attributes from any format other than Hash or HashWithIndifferentAccess losing the data" to be skipped in `store.test.ts` (see PR #4205, commit that adds `it.skip`).

Relevant files:

- `packages/activerecord/src/type/serialized.ts:97-119` — `cast()` method
- `vendor/rails/activemodel/lib/active_model/type/helpers/mutable.rb:4-6` — Rails `Mutable#cast`
- `packages/activerecord/src/store.test.ts` — "convert store attributes from any format" skipped

## Acceptance criteria

- [ ] `Serialized#cast` replaced with the same `deserialize(serialize(value))` pattern as Rails `Mutable#cast`
- [ ] Pre-encoded string shortcut removed (or narrowed to binary subtypes only, which is the only case where the original shortcut had a meaningful justification)
- [ ] `store.test.ts` "convert store attributes from any format other than Hash or HashWithIndifferentAccess losing the data" un-skipped and passing
