---
title: "EnvironmentInquirer's generated development?/test?/production? are untyped, forcing casts at call sites"
status: draft
updated: 2026-09-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/environment_inquirer.rb:28-32` generates real
`development?` / `test?` / `production?` methods with `class_eval`. trails generates them at runtime with
`Object.defineProperty` (`packages/activesupport/src/environment-inquirer.ts`), but the class TYPE does not
declare them, so every caller has to cast:

- `packages/trailties/src/application/finisher.ts:115` — `(Trails.env as unknown as Record<string, () => boolean>)["development?"]()`
- `packages/actionpack/src/action-controller/log-subscriber.ts` (`action_controller/log_subscriber.rb:40`,
  `Rails.env.development?`) — same cast, added in trails#8037.

## Acceptance criteria

- `EnvironmentInquirer`'s type declares the three generated predicates (for example a declaration-merged
  `interface EnvironmentInquirer` beside the class, per CLAUDE.md § "Generated attribute readers are properties").
  Whatever shape is chosen must keep `parity:api:extra` from counting them as novel surface.
- Both casts above are deleted, and the call sites read `Trails.env["development?"]()` like `engine.ts`'s
  `env["local?"]()`.
