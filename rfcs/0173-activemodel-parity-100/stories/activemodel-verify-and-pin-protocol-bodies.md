---
title: "activemodel: verify and pin the 18 value-protocol pairs matched since the body-pin floor"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: pins
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` activemodel **pins 519/537 (18 unpinned)** — protocol definitions RFC 0156 enrolled
after the `--pin-all` floor: `attribute.rb` (`encode_with`, `init_with`, `initialize_dup`),
`errors.rb` (`initialize_dup`, `inspect`, `to_hash`), `attribute_set.rb` (`initialize_dup`, `to_hash`),
`error.rb` (`initialize_dup`, `inspect`), `api.rb`, `attribute_set/builder.rb`, `attributes.rb`,
`dirty.rb`, `validations.rb` (`initialize_dup`), and `type/date.rb`, `type/date_time.rb`, `type/time.rb`
(`default_timezone`), all under `vendor/rails/v8.0.2/activemodel/lib/active_model/`.

## Acceptance criteria

- [ ] Each pair is verified line-for-line against its Rails body and fixed where it diverges.
- [ ] `body-pins.ts --pin <ruby-file>` per file with a `reason` naming this story; activemodel pins **100%**.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins
```
