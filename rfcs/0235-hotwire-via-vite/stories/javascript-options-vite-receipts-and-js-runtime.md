---
title: "trailties: receipt the vite JAVASCRIPT_OPTIONS/default deviation and decide usingJsRuntime for vite"
status: ready
updated: 2026-11-17
rfc: "0235-hotwire-via-vite"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trailties-javascript-default-vite` was closed against trails#10215, but its acceptance criterion "both sites carry the receipt" was never met. `packages/trailties/lib/generators/app-base.ts:48` (`JAVASCRIPT_OPTIONS = ["vite", ...]`) and `lib/generators/trails/app/app-generator.ts:522-528` (`default: "vite"`) differ from Rails' `vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb` (`JAVASCRIPT_OPTIONS` with `importmap`, default `importmap`). The deviation is ratified in CLAUDE.md § "importmap-rails and propshaft are out of scope; JavaScript is served by Vite (`vite_rails`)", which does not say what shape the receipt takes. Also, `usingJsRuntime` (`app-base.ts:531-536`) treats `vite` like Rails treats `importmap`, as not a JS runtime. The story asked for the opposite. Rule on which is right, then converge.

## Acceptance criteria

- Both sites carry a receipt in a shape the gates accept, pointing at the CLAUDE.md section.
- `usingJsRuntime`'s treatment of `vite` is decided against vite_rails' install, which needs node, and is converged to match.
