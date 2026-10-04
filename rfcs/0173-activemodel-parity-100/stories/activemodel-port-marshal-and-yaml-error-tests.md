---
title: "activemodel: port the 3 unported-register tests (Marshal / Rails-6 YAML errors)"
status: blocked
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: tests
packages: ["activemodel"]
deps:
  - ruby-compat-marshal-core-types
  - psych-load-and-safe-load
  - ruby-compat-marshal-load-core-types
  - errors-psych-loaded-symbol-attribute-does-not-match-added-attribute
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-04T16:08:54Z"
assignee: "activemodel-port-marshal-and-yaml-error-tests"
blocked-by: "Marshal.load does not exist (ruby-compat Marshal is dump-only; ruby-compat-marshal-load-core-types is draft), which both Marshal tests need; the YAML test loads but fails on Error#attribute spelling (':name' from Psych vs 'name' from add) — errors-psych-loaded-symbol-attribute-does-not-match-added-attribute"
closed-reason: null
---

## Context

`scripts/parity/unported-files/unscoped.ts` holds three per-test activemodel exclusions:

- `attributes_test.rb` — "attributes with proc defaults can be marshalled" (`vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`),
  `Marshal.load(Marshal.dump(data))`.
- `errors_test.rb` — "errors are marshalable" (`vendor/rails/v8.0.2/activemodel/test/cases/errors_test.rb:670-678`) and
  "errors are compatible with YAML dumped from Rails 6.x".

The reasons say Ruby Marshal / Psych have no JS equivalent — no longer true: ruby-compat's Marshal is
`ruby-compat-marshal-core-types` (RFC 0154) and Psych is RFC 0170 (`psych-load-and-safe-load`).

## Acceptance criteria

- [ ] The three cases are ported with Rails' bodies and their unported entries deleted.
- [ ] `ActiveModel::Errors` / `Attribute` round-trip through ruby-compat Marshal and Psych as Rails does.

## Verification

```bash
pnpm parity:test --package activemodel --missing && pnpm parity:test:assertions
```
