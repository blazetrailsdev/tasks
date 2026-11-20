---
title: "trailties: decide and provide the css:install commands runCss dispatches to"
status: claimed
updated: 2026-11-20
rfc: "0235-hotwire-via-vite"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-11-20T03:38:49Z"
assignee: "app-generator-css-option-tests"
blocked-by: null
closed-reason: null
---

## Context

`runCss` (`packages/trailties/lib/generators/app-base.ts`) mirrors
`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:627-635`. With a
JS runtime it calls `css:install:<css>` (cssbundling-rails), and without one it
calls `tailwindcss:install` / `dartsass:install`. Since trails#10254 the
default `vite` app is a JS runtime, so `trails new --css tailwind` runs
`css:install:tailwind`. No trails package defines any of these commands, so
`--css` names an installer that does not exist.

## Acceptance criteria

- Decide whether cssbundling-rails is ported, or whether vite covers CSS the way CLAUDE.md § "importmap-rails and propshaft are out of scope" lets it cover JS. Record the ruling in that section.
- If ported: add the `css:install:<css>` commands for each `CSS_OPTIONS` entry, and a test that `trails new --css tailwind` finishes.
