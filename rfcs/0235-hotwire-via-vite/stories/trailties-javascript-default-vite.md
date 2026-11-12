---
title: "Generator: --javascript defaults to vite and runJavascript calls vite:install"
status: draft
updated: 2026-11-12
rfc: "0235-hotwire-via-vite"
cluster: generator
packages: [trailties]
deps: [hotwire-vite-claude-md-ruling, vite-trails-install-and-precompile-hook]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/generators/app-base.ts:48` holds
`JAVASCRIPT_OPTIONS = ["importmap", "bun", "webpack", "esbuild", "rollup"]`.
`app-base.ts:742-756` (`runJavascript`) calls `importmap:install`, and
`runHotwire` (`:758-762`) calls `turbo:install stimulus:install`.
`lib/generators/trails/app/app-generator.ts:498-503` defaults `javascript` to
`importmap`. `test/generators/app-base.test.ts:170` asserts
`importmap:install`. Rails' counterpart is
`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`
(`JAVASCRIPT_OPTIONS`, `run_javascript`).

## Acceptance criteria

- `"vite"` replaces `"importmap"` in `JAVASCRIPT_OPTIONS`, and the
  `--javascript` default is `vite`. Both sites carry the receipt that the
  ratified CLAUDE.md section prescribes.
- `runJavascript`'s `vite` arm calls `vite:install`, and the importmap arm is
  removed. `usingJsRuntime` and its siblings (`app-base.ts:532-545`) treat
  `vite` as a JS runtime.
- `app-base.test.ts` asserts `vite:install`. The Rails test arms that only
  cover importmap are dropped with a receipt citing the section.
