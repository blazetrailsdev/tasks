---
title: "activesupport: close subscriber.rb and output_safety.rb API gaps"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api --missing`:

- `subscriber.rb` (11/18): `initialize`, `subscriber`, `notifier`,
  `namespace` (the `attr_reader`s), `find_attached_subscriber`,
  `prepare_pattern`, `pattern_subscribed?`.
- `core_ext/string/output_safety.rb` (18/25): `original_concat`,
  `encode_with`, `gsub`, `gsub!`, `sub`, `sub!`,
  `set_block_back_references`.

`_addEventSubscriber` / `_removeEventSubscriber` also take an extra `state`
parameter that Rails does not have. That arity row belongs to
`activesupport-api-structure-misplaced-inheritance-arity`, but fix it here if
the `Subscriber` rewrite reaches it.

## Acceptance criteria

- [ ] Port the 14 members onto their Rails owners.
- [ ] Both files reach 100%.
