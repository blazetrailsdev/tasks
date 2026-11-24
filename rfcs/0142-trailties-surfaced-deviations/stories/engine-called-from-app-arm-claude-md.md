---
title: "trailties: write the CLAUDE.md receipt for Engine#config's called_from/app arm"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The operator ruled on 2026-11-24 (trails#10688) that `Engine#config`'s arm adding `called_from/{app,app/controllers,app/channels,app/helpers,app/models,app/mailers}` for a package-shipped engine (`packages/trailties/lib/engine.ts`, the `config` getter) widens `packages/trailties/CLAUDE.md` § "A package-shipped engine's root is its package root". The section text was never written. Rails lists these paths under `root` only (`vendor/rails/v8.0.5.2/railties/lib/rails/engine/configuration.rb:44-51`). Rationale: compiled `app/` code lives under `called_from` (`dist/`), while views, locales, `config/` and `db/migrate` stay at the package root.

## Acceptance criteria

- [ ] The section is widened with the arm and the ruling date, so the arm has a written receipt in the tree.
