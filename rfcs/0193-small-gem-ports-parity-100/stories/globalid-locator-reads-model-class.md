---
title: "globalid-locator-reads-model-class"
status: in-progress
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9132
claim: "2026-10-20T13:55:38Z"
assignee: "globalid-extract-top-level-global-id-rb"
blocked-by: null
closed-reason: null
---

## Context

`packages/globalid/src/locator.ts` resolves the model with `safeConstantize(gid.modelName)` and returns null on a miss in `BaseLocator#locate`, `#modelIdIsValid`, `UnscopedLocator#locate`, and `Locator.locateMany`'s allowed filter, and carries an invented `modelIdArityMatches` facade check. Rails reads `gid.model_class` (constantize, raising `NameError`) everywhere: `vendor/globalid/v1.3.0/lib/global_id/locator.rb:160-166` (`BaseLocator#locate`), `:190-192` (`model_id_is_valid?`), `:212-214` (`UnscopedLocator#locate`), `:59-63` (`locate_many`). `Locator.locate` was converged in trails#9120.

## Acceptance criteria

- [ ] Every locator path reads `gid.modelClass`; no `safeConstantize` remains in locator.ts.
- [ ] `modelIdArityMatches` outside `model_id_is_valid?` is removed; TS-only tests asserting the null arms are removed or converged.
