---
title: "app-generator-css-option-tests"
status: draft
updated: 2026-11-17
rfc: "0235-hotwire-via-vite"
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

## Context

Rails covers the CSS installer choice in `vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:986-1012`:
`test_css_option_with_tailwind_uses_cssbundling_gem_when_using_node`,
`test_css_option_with_asset_pipeline_sass`,
`test_css_option_with_sass_uses_cssbundling_gem_when_using_node`,
`test_css_option_with_cssbundling_gem`. They assert `@rails_commands`
(`dartsass:install`, `css:install:postcss`) and Gemfile entries
(`cssbundling-rails`, `tailwindcss-rails`, `dartsass-rails`). The trails
port `packages/trailties/test/generators/app-generator.test.ts` has none of
them. `runCss` (`packages/trailties/lib/generators/app-base.ts`) follows
`app_base.rb:627-635`, and since trails#10254 vite counts as a JS runtime.

## Acceptance criteria

- Port the four tests by their Rails names into `app-generator.test.ts`, with the `@rails_commands` assertions.
- Decide how a trails app records the gem the Rails test checks for (`assert_gem`), and port that assertion. If it can't be ported, drop it with an assertion receipt.
