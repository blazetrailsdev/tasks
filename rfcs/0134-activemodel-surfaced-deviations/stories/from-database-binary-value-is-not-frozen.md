---
title: "from-database-binary-value-is-not-frozen"
status: closed
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-05T09:02:11Z"
assignee: "from-database-binary-value-is-not-frozen"
blocked-by: null
closed-reason: "Premise refuted on both sides, verified against origin/main and vendor/rails. (1) Rails has no freeze: no .freeze in Attribute::FromDatabase (activemodel/lib/active_model/attribute.rb:173-195) or Type::Binary (binary.rb:20-27) — the frozen blob comes from the sqlite3 gem's result strings, and pg/mysql2 do not freeze, so freezing in FromDatabase#type_cast would be invented behavior at a non-Rails site applied to every type. (2) JS cannot express it: Object.freeze(new Uint8Array(n>0)) throws TypeError 'Cannot freeze array buffer views with elements', so it could only be done with an invented Proxy wrapper. Closing as premise-gone rather than blocked; if still wanted, respec as an adapter-result-level story naming the driver behavior it mirrors."
---

## Context

Surfaced while converging `binary-attribute-changed-uses-reference-equality`.

Rails freezes the value a `FromDatabase` attribute type-casts, so an in-place
mutation of a binary attribute read from the database raises rather than going
undetected. Verified against MRI with the vendored Rails
(`vendor/rails/activerecord`, sqlite3, `binaries` table):

```text
value frozen: true   aliased: true
in-place: FrozenError
from-user in-place changed: true
```

`Attribute::FromDatabase#original_value_for_database` returns
`value_before_type_cast`, and `ActiveModel::Type::Binary#cast`
(`vendor/rails/activemodel/lib/active_model/type/binary.rb:20-27`) returns the
identical String when the input is already `Encoding::BINARY`, so the "original"
and the cast value are the same object. Rails is safe only because that object
is frozen.

trails has the aliasing (`packages/activemodel/src/attribute.ts:201-210`,
`packages/activemodel/src/type/binary.ts:19-25`) but not the freeze, so
`(await Binary.find(id)).data[0] = 0x01` silently reports `changed === []`
instead of raising.

The from-user arm and the equal-bytes-reassignment arm both match Rails as of
the binary-attribute-changed-uses-reference-equality PR; this story is only the
from-database freeze.

## Acceptance criteria

- [ ] A `FromDatabase` attribute's cast value is frozen the way Rails' is, so an
      in-place mutation of a binary attribute read from the database raises
      rather than being silently ignored.
- [ ] Scope the freeze deliberately: enumerate which other types hand back a
      mutable JS object from `cast` and would change behavior.
- [ ] parity:api / parity:test delta non-negative.
