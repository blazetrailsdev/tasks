---
title: "usingJsRuntime treats the vite default as needing a JS runtime"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# usingJsRuntime treats the vite default as needing a JS runtime

## Context

Rails' `using_js_runtime?` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`) is `(options[:javascript] && options[:javascript] != "importmap") || (options[:css] && !%w[tailwind sass].include?(options[:css]))`. trails#10215 replaced `importmap` with `vite` in `JAVASCRIPT_OPTIONS`, in the `--javascript` default and in `AppBase#usingJsRuntime` (`packages/trailties/lib/generators/app-base.ts`), so the default `vite` reads as "no JS runtime". Vite runs on node, though. That keeps the Dockerfile's node-install arm and `runCss`'s `tailwindcss:install` / `dartsass:install` arms on importmap's non-node branch. Root CLAUDE.md § "importmap-rails and propshaft are out of scope" makes vite the default, but does not decide this predicate.

## Acceptance criteria

- Decide how `usingJsRuntime` / `usingNode` answer for `vite`, against root CLAUDE.md § importmap-rails and propshaft, and converge `runCss` and the Dockerfile template's node arms to match.
- Port the Rails tests covering `using_js_runtime?` for the default JavaScript option, so they pin the behaviour.
