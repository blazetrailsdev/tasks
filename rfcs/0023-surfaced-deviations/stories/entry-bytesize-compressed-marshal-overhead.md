---
title: "Converge Entry#bytesize compressed non-String branch to Rails Marshal.dump overhead"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 3702
claim: "2026-06-20T03:34:42Z"
assignee: "entry-bytesize-compressed-marshal-overhead"
blocked-by: null
---

## Context

`packages/activesupport/src/cache/entry.ts` `bytesize()`:

```ts
if (this._compressed) return (this._value as string).length;
```

Rails (`entry.rb:65-68`):

```ruby
@s ||= Marshal.dump(@value).bytesize
```

For a compressed non-String value (Array, Object), Rails measures the byte size of `Marshal.dump` of the **compressed payload string** — which includes Marshal framing overhead (~6 bytes). Trails returns the raw compressed byte count (latin1 string length), which is slightly lower.

nil/bool/Numeric are never compressed (`entry.rb:79-82`), so only Array/Object hits this branch in practice.

Introduced in PR #3676 as an intentional approximation (the prior code JSON-escaped the binary string and over-reported far more). Tracked here for convergence.

## Acceptance criteria

- `Entry#bytesize` for a compressed Array/Object value returns the same byte count as Rails `Marshal.dump(@value).bytesize` on the compressed payload string.
- Existing `serializer-with-fallback.test.ts` "can compress entries" tests still pass.
- `entry.rb` bytesize tests (if ported) pass.
