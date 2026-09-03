---
title: "Restore Rails' DEFAULT_PROPERTIES accessor loop in encryption/properties.ts and with it the missing encoding seat"
status: in-progress
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps:
  - "credit-defineproperty-loop-generated-accessors"
deps-rfc: []
est-loc: 160
priority: 3
pr: 7435
claim: "2026-09-03T10:51:58Z"
assignee: "port-encryption-properties-encoding-accessor"
blocked-by: null
closed-reason: null
---

## Context

`encryption/properties.rb` sits at 19/21, missing `encoding` and `encoding=`.

Rails generates all six accessor pairs from one constant:

```ruby
DEFAULT_PROPERTIES = {
  encrypted_data_key: "k", encrypted_data_key_id: "i", compressed: "c",
  iv: "iv", auth_tag: "at", encoding: "e"
}

DEFAULT_PROPERTIES.each do |name, key|
  define_method(name) { self[key.to_sym] }
  define_method("#{name}=") { |value| self[key.to_sym] = value }
end
```

(`vendor/rails/activerecord/lib/active_record/encryption/properties.rb:22-39`.)

trails hand-expands the loop into five accessor pairs
(`packages/activerecord/src/encryption/properties.ts:85-122` —
`encryptedDataKey`, `encryptedDataKeyId`, `compressed`, `iv`, `authTag`) and
simply omits the sixth. So there are two defects here, and both are in scope:
the missing `encoding` seat is a genuine absence (bucket C), and the
hand-expansion of a Rails generator is the decomposition divergence CLAUDE.md
forbids.

Converging to the loop is only safe once
`credit-defineproperty-loop-generated-accessors` teaches the extractor to
credit an accessor pair installed in a loop; without it, replacing five bodied
accessors with a loop would take the file from 19/21 to 9/21. Hence the
dependency.

## Acceptance criteria

- `properties.ts` carries a `DEFAULT_PROPERTIES` constant with all six
  name→key entries in Rails' order, and installs the reader/writer pair for
  each in one loop — Rails' decomposition, not six hand-written pairs.
- `encoding` and `encoding=` read and write the `"e"` key, and a test covers a
  round-trip through them.
- activerecord `encryption/properties.rb` reaches **21/21**; package total
  rises by 2 and no other member of that file regresses.
- The encryption suite passes; `pnpm parity:api:calls` and `:calls:args` clean.

## Definition of done

Adding a sixth hand-written accessor pair beside the five does not close this story. The hand-expansion of Rails' `DEFAULT_PROPERTIES.each` loop is itself the decomposition divergence.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm vitest run packages/activerecord/src/encryption/
```

Read the `encryption/properties.rb` row: it must be 21/21, not 9/21. A drop
means `credit-defineproperty-loop-generated-accessors` has not landed yet.
