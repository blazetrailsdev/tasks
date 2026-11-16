---
title: "vite:verify_install always enhances environment (vite-trails depends on trailties in package.json)"
status: done
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10209
claim: "2026-11-16T21:28:22Z"
assignee: "vite-assets-require-framework-libraries-loads-vite-trails"
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_rails/lib/tasks/vite.rake:5` enhances `vite:verify_install` with `:environment` only when the framework is loaded. Its port, `packages/vite-trails/lib/tasks/vite.ts:6` (trails#10200), guards on `Gem.loadedSpecs["trails"]`, which is always empty in a Node process (`packages/ruby-compat/lib/gem.ts:83-89`, RubyGems is not ported per CLAUDE.md, trails#10021), so `environment` is never a prerequisite.

The guard has no JS counterpart to read: `packages/vite-trails/package.json` declares `@blazetrails/trailties` as a hard dependency, so whenever `lib/tasks/vite.ts` is imported the framework package is installed and loaded. The condition is constantly true.

## Acceptance criteria

- `lib/tasks/vite.ts` calls `.enhance(["environment"])` unconditionally and no longer imports `Gem`; the dropped guard is receipted at the call site, citing the `@blazetrails/trailties` dependency in `package.json`.
- Nothing seats or reads `Gem.loadedSpecs` for this.
- A test asserts `vite:verify_install` lists `environment` as a prerequisite after importing `lib/tasks/vite.ts`.
