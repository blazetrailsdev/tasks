---
title: "ActionController::Railties export takes the Trailties token rename"
status: claimed
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-16T16:36:44Z"
assignee: "mime-type-proxy-lifts-into-the-prototype-chain"
blocked-by: null
closed-reason: null
---

## Context

Rails `ActionController::Railties` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/railties/helpers.rb:3-5`) is spelled `ActionController::Trailties` by the token renames (`renameTokens`, `scripts/api-compare/class-paths.ts`; `TS_CLASS_RENAMES` in `scripts/parity/conventions.ts`). The TS export is still `Railties`, at `packages/actionpack/lib/action-controller/index.ts` (`export const Railties = { Helpers: RailtiesHelpers }`). The module's own directory already uses `trailties/helpers.ts`. trails#10154 had to run `renameTokens` over the walked path in `rubyAnswered` before this export would match its Ruby module.

Readers: `packages/trailties/lib/application/finisher.ts:314` and `packages/trailties/test/trailties/action-controller.test.ts:100`.

## Acceptance criteria

- [ ] The export is `Trailties`, as the token rename gives it, and both readers use the new name.
- [ ] `pnpm parity:class-paths --check` stays green.
