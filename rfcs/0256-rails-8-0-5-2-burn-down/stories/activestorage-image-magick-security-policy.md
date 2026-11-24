---
title: "activestorage-image-magick-security-policy"
status: in-progress
updated: 2026-11-24
rfc: "0256-rails-8-0-5-2-burn-down"
cluster: null
packages: []
deps:
  - rails-8-0-5-2-activestorage
deps-rfc: []
est-loc: null
priority: null
pr: trails#10689
claim: "2026-11-24T03:24:55Z"
assignee: "activestorage-image-magick-security-policy"
blocked-by: null
closed-reason: null
---

## Context

Rails v8.0.5.2 adds `activestorage/lib/active_storage/image_magick.rb` (the `ActiveStorage::ImageMagick` policy module, `MINIMAGICK_AVAILABLE` / `MINIMAGICK_UNSECURABLE`, `ActiveStorage.require_securable_mini_magick!`) and ships `lib/active_storage/image_magick/policy.xml`. `analyzer/image_analyzer/image_magick.rb:22` now calls `ActiveStorage.require_securable_mini_magick!` in `read_image`, and `engine.rb:98-102` applies the policy in `after_initialize`. trails has none of it: `packages/activestorage/lib/analyzer/image-analyzer/image-magick.ts` `readImage` is unchanged, and the bump ledger row `analyzer/image_analyzer/image_magick.rb:read_image` remains. Shipping `policy.xml` needs a build step copying it to `dist/` (tsc does not copy XML); `POLICY_DIRECTORY` is `File.expand_path("image_magick", __dir__)`. `MiniMagick.cliEnv=` exists in `packages/mini-magick/lib/configuration.ts`.

Deferred from the rails-8-0-5-2-activestorage burn-down.

## Acceptance criteria

- [ ] `lib/image-magick.ts` ports `image_magick.rb` (apply_policy, configure_path, operator_paths, require_securable_mini_magick!) with `policy.xml` shipped beside it.
- [ ] `ImageMagick#readImage` calls `ActiveStorage.requireSecurableMiniMagick()`; engine applies the policy after initialize.
- [ ] The 16 upstream-added `test/image_magick_test.rb` tests are ported (or each recorded with its reason).
- [ ] `pnpm tsx scripts/api-compare/body-pins.ts --pin analyzer/image_analyzer/image_magick.rb`; no activestorage row left in `scripts/parity/bump-ledger/rails.json`.
