---
title: "activemodel: port the 7 dropped block arms (parity:api:blocks mark 7)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: ["attribute-set-fetch-value-tests-uninitialized-instead-of-yielding"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/block-param-mark.json` holds activemodel at **7** — Ruby methods taking `&block`
whose TS port has no trailing function parameter and no block arm:

- `AttrNames.define_attribute_accessor_method` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:577`)
- `Attribute#value` and `Attribute::Uninitialized#value` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:41,249`) — the
  `&block` that `fetch_value` forwards (see `attribute-set-fetch-value-tests-uninitialized-instead-of-yielding`, RFC 0082)
- `Model.validates_with` / `Validations.validates_with` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/with.rb:88,144`, reported twice)
- `Validations.validate` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:160,370`)

RFC 0156's `converge-activerecord-dropped-block-arms-remainder` is the activerecord twin.

## Acceptance criteria

- [ ] Each method takes Rails' block as a trailing function parameter and ports the block arm's control flow.
- [ ] `pnpm parity:api:blocks:tighten` narrows activemodel's mark 7 → **0**.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activemodel && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
