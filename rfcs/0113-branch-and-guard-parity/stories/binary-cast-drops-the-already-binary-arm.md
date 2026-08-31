---
title: "binary-cast-drops-the-already-binary-arm"
status: blocked
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 3
pr: 7287
claim: "2026-08-31T09:54:12Z"
assignee: "locator-use-drops-the-no-locator-raise"
blocked-by: 'The arm has no representable trails analogue, so the story''s ''missing arm'' classification does not hold. ValueType#castValue is the identity (packages/activemodel/src/type/value.ts:91-93), so super.cast() returns a Uint8Array untouched and the existing ''typeof value === "string"'' test IS the port of Rails'' second condition: trails'' binary representation is Uint8Array and a JS string is never already binary, so ''value.encoding != Encoding::BINARY'' is true for every value that reaches the re-encode. Writing the condition out (!(value instanceof Uint8Array) && typeof value === ''string'') is provably dead — it can only short-circuit where the string test already failed — and no regression test can distinguish it from the current body, which is why the attempt on PR #7287 was reverted. What remains is a report-only arm-count row, not a behavioural gap. Converging it would need a trails value that models an already-BINARY Ruby String distinctly from a text one; that is a design change to ActiveModel::Type::Binary''s representation and belongs in its own story.'
closed-reason: null
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
