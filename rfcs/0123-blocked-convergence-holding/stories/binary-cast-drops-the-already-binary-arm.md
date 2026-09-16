---
title: "binary-cast-drops-the-already-binary-arm"
status: closed
updated: 2026-09-16
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 3
pr: trails#7287
claim: "2026-08-31T09:54:12Z"
assignee: "locator-use-drops-the-no-locator-raise"
blocked-by: null
closed-reason: "Premise falsified: ValueType#castValue is the identity, so the typeof string test IS the port; the trails#7287 attempt was reverted as provably dead"
---

## Context

`ActiveModel::Type::Binary#cast`
(`vendor/rails/activemodel/lib/active_model/type/binary.rb:20-28`):

```ruby
def cast(value)
  if value.is_a?(Data)
    value.to_s
  else
    value = super
    value = value.b if ::String === value && value.encoding != Encoding::BINARY
    value
  end
end
```

`packages/activemodel/src/type/binary.ts#cast` keeps the `Data` arm and the
`super` call but drops the encoding arm, encoding EVERY string unconditionally:

```ts
value = super.cast(value);
if (typeof value === "string") value = textEncoder.encode(value);
```

Rails re-encodes only a String that is not ALREADY `Encoding::BINARY`; a value
that is already binary passes through untouched. The port has no way to observe
"already binary" from a JS string, which is the question this story has to
answer — a `Uint8Array` input is the trails analogue of a BINARY-encoded String
and must NOT be re-encoded.

Surfaced by the RFC 0113 noise-floor audit (row 26 of the seed-113 sample,
`docs/infrastructure/arm-mismatch-noise-floor.md`), classified `real` — a
missing arm.

## Converged shape

Port both arms of the modifier-if: the re-encode applies only when the value is
a String that is not already the binary representation. Cite the encoding
mapping at the call site if trails' binary representation forces a spelling
change.

## Acceptance criteria

- [ ] `cast` leaves an already-binary value (trails' `Uint8Array`) untouched
      rather than re-encoding it.
- [ ] Both arms are exercised by tests named after the Rails tests that cover
      them.
- [ ] The row leaves `pnpm parity:api:arms:report`.
