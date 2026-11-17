---
title: "Parameters#toHash returns a type you can index without a cast"
status: draft
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/lib/action-controller/metal/strong-parameters.ts:525`:
`toHash(): Hash<string, unknown> | Record<string, unknown>`. The union cannot
be indexed by key, so `params.require("repository").permit("checkout_path").toHash().checkout_path`
fails TS2339 and needs a cast (trailmap#150,
`app/controllers/repo-settings-controller.ts`, `_checkoutParams`). Rails'
`to_h` answers a plain Hash you index directly.

## Acceptance criteria

- `toHash()` returns `Record<string, unknown>` (or an overload keyed by the
  permitted names), so `permit("x").toHash().x` typechecks without a cast.
- A type test in actionpack covers it.
