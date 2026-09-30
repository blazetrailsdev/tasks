---
title: "activemodel: the two option-key mismatches (as_json, set_options_for_callback)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: calls-args
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/output/options-key-mismatches.json` (advisory) lists two activemodel pairs:

- `serializers/json.ts` `as_json` — TS reads `except`, `include`, `methods`, `only` that the Ruby
  body (`vendor/rails/v8.0.2/activemodel/lib/active_model/serializers/json.rb:96`) passes straight through to `serializable_hash`.
- `validations/callbacks.ts` `set_options_for_callback` — TS reads `unless`, which Rails'
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/callbacks.rb:99`) never reads.

An option key Rails' body does not read is an invented arm (the TS body branches on it) or a
declared-type artifact (the extractor reads the options _type_). Decide per key.

## Acceptance criteria

- [ ] Every extra key is either removed from the body (the Rails body does not read it) or shown to be an options-type artifact and fixed in `scripts/api-compare/options-keys.ts` with a test.
- [ ] `options-key-mismatches.json` lists no activemodel pair.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
