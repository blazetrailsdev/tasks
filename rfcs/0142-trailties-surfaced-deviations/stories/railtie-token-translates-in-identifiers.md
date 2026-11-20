---
title: "railtie-token-translates-in-identifiers"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# The railtie token translates to trailtie in identifiers, not only in paths and class names

## Context

`scripts/parity/conventions.ts` translates `railtie` → `trailtie` only for file-path segments
(the path aliases, `docs/ruby-ts-conventions.md` § "File paths") and class names
(`TS_CLASS_RENAMES`: `Railtie` → `Trailtie`, `Railties` → `Trailties`). `TOKEN_RENAMES`
(`conventions.ts:54`) carries `rails` → `trails` and `erb` → `tse` but no `railtie` entry, so a
Ruby identifier such as `Rails::Engine#railtie_name` / `railtie_namespace`
(`vendor/rails/v8.0.2/railties/lib/rails/engine.rb`), `Rails::Railtie::Configuration`, or a local
`railtie` ports as `railtieName`, `railtieNamespace`, `railtie`, and `parity:api` expects exactly that.
The operator ruled the token always translates.

Whole-word occurrences in `packages/*/lib` (2026-11-20, comments and generated files excluded):
`railties` ×45, `railtie` ×35, `Railtie` ×19, `railtieName` ×17, `Railties` ×12,
`railtieNamespace` ×6, `railtiesOrder`, `railtiesLoadPath`, `railtiesInitializers`,
`RailtiesHelpers`, `RailtieConfiguration`. Heaviest files: `trailties/lib/engine.ts`, `all.ts`,
`application.ts`, `trailtie.ts`, `commands/runner.ts`, `commands/app/update-command.ts`,
`activerecord/lib/trailties/databases.ts`, `activerecord/lib/namespaces.ts`; cross-package readers in
`actionpack/lib/action-dispatch/routing/mapper.ts:76,1606` and `activesupport/lib/namespaces.ts:148`.

## Acceptance criteria

- `TOKEN_RENAMES` gains `railtie`/`trailtie`, `railties`/`trailties` and their capitalised forms;
  `docs/ruby-ts-conventions.md` is regenerated from it.
- Every identifier, option key and test helper spelled with the token is renamed (`trailtieName`,
  `trailtieNamespace`, `trailtiesOrder`, …), in one mechanical sweep; test names follow the token rule.
- `pnpm parity:api`, `parity:api:params` and `parity:api:extra:gate` show no regression.
