---
title: "No isolation test-app builder to strip the ESLint autocorrect line (abstract_unit.rb:151)"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

Rails' isolation test-app builder strips the commented autocorrect line from every generated test app:
`remove_from_env_config("development", "config.generators.apply_rubocop_autocorrect_after_generate!")`
(`railties/test/isolation/abstract_unit.rb:151`). trails' AppGenerator emits the analogue
`// this.config.generators().applyEslintAutocorrectAfterGenerateBang();`
(`packages/trailties/src/generators/app-generator.ts`). But trailties has no isolation `build_app`
that generates an app and then edits its config, so there is nothing to strip from.

## Converged shape

Port `Rails::Generation`'s `build_app` / `add_to_env_config` / `remove_from_env_config`
(`abstract_unit.rb:120-155`, `:330-360`) as a trailties test helper, including the `:151` removal.

## Acceptance criteria

- A trailties isolation test app built by the helper has no `applyEslintAutocorrectAfterGenerateBang`
  line in `config/environments/development.ts`.
