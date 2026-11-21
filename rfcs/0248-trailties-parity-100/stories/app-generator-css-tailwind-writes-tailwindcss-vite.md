---
title: "app-generator-css-tailwind-writes-tailwindcss-vite"
status: in-progress
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10528
claim: "2026-11-21T21:57:40Z"
assignee: "app-generator-css-tailwind-writes-tailwindcss-vite"
blocked-by: null
closed-reason: null
---

## Context

`test_css_option_with_asset_pipeline_tailwind`
(`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:977-984`) asserts
`tailwindcss:install` runs and `tailwindcss-rails` is in the Gemfile. packages/trailties/CLAUDE.md
§ "A Gemfile is a package.json" maps `tailwind_gemfile_entry` / tailwindcss-rails to
`@tailwindcss/vite` in `vite.config.ts` plus `@import "tailwindcss"`, and says `app-base.ts`'s
`tailwindcss:install` call (`runCss`) converges onto it. Today `--css=tailwind` adds no package.json
entry, so the test was left unported by the app-generator part-1/2 bundle.

## Acceptance criteria

- [ ] `--css=tailwind` writes `@tailwindcss/vite` to package.json and registers the plugin in `vite.config.ts`, per the mapping.
- [ ] `it("css option with asset pipeline tailwind")` ported with the mapped Rails body, passing.
