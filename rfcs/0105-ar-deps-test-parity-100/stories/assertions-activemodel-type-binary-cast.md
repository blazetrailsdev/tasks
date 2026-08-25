---
title: "assertions-activemodel-type-binary-cast"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6648
claim: "2026-08-17T12:55:24Z"
assignee: "assertions-activemodel-type-binary-cast"
blocked-by: null
closed-reason: null
---

## Context

Cut from `assertions-activemodel-type-cluster-fourth-pass` (PR under the
700-LOC ceiling). That PR converged `type/decimal_test.rb`,
`type/float_test.rb`, `type/string_test.rb` and `type/registry_test.rb`;
`type/binary_test.rb` is the one file in the cluster left at 1 assertion-count
/ 2 assertion-kind mismatches, because it needs a `Binary#cast` rewrite with an
AR-wide blast radius.

`vendor/rails/activemodel/lib/active_model/type/binary.rb:18-26`:

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

`super` is `Value#cast`, whose `cast_value` is identity — so only a `::String`
is coerced. `binary_test.rb:12` is `assert_equal 1, type.cast(1)`: an Integer
comes straight back out as an Integer.

`packages/activemodel/src/type/binary.ts`'s `cast` instead runs
`textEncoder.encode(String(value))` over every non-`Uint8Array`, so `cast(1)`
answers a `Uint8Array`, and the declared return type is `Uint8Array | null`.
Converging means the non-String arm passes through unchanged (widening the
return type) and auditing every AR caller that assumes `cast` on a binary
column yields bytes — `connection-adapters/**` quoting, `type/binary`-backed
attributes, and the encryption cluster.

The remaining Rails assertions in `test_type_cast_binary` turn on
`Encoding::BINARY` (`type.cast("1").encoding`, `"ƒée".b`) and are separately
inexpressible; the existing port documents that at the call site. Decide which
of them can be expressed against `Uint8Array` and note the rest.

## Acceptance criteria

- `type/binary_test.rb` reaches 0 assertion-count / -kind / -value mismatches
  in `pnpm parity:test -- --assertions --package activemodel`, or each residual
  arm carries a call-site note naming the Ruby construct with no TS spelling.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution; never raised.
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
