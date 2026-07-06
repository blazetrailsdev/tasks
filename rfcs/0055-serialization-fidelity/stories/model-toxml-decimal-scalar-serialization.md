---
title: 'Model#toXml serializes decimal as scalar type="decimal", not nested Decimal object'
status: ready
updated: 2026-07-06
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Model#toXml` type= derivation
(PR #4574, story `model-toxml-type-attr-adapter-dependent`).

A `decimal` attribute's value in `serializableHash` is a `Decimal` **object**
(carrying `sign`/`intDigits`/`fracDigits`), not a scalar string/number. In
`Model#_hashToXml` (`packages/activemodel/src/model.ts`) it therefore hits the
plain-object recursion branch and serializes as nested sub-tags, e.g.

```xml
<price>
  <sign></sign>
  <intDigits>9</intDigits>
  <fracDigits>99</fracDigits>
</price>
```

Rails serializes a `BigDecimal` as a scalar with `type="decimal"`:

```xml
<price type="decimal">9.99</price>
```

`XML_MINI_TYPE_NAMES` already maps `decimal -> "decimal"`, and the cast-type
`type=` derivation added in PR #4574 would stamp `type="decimal"` correctly —
but only once the value reaches a scalar branch, which it never does while it
is a `Decimal` object. The fix is on the serialization/rendering side: a
`Decimal` value must render as its decimal string (`to_s`) rather than
recursing as a plain object.

## Acceptance criteria

- A `decimal` attribute serializes via `toXml` as a scalar
  `<name type="decimal">9.99</name>`, mirroring Rails `BigDecimal#to_xml`.
- `_hashToXml` treats a `Decimal` value as a leaf (renders its string form),
  not as a plain object to recurse into.
- Regression test asserting the full `<price type="decimal">…</price>` tag.
- No api:compare / test:compare regression.
