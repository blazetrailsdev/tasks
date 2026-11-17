---
title: "bin/vite deadlocks: vite-assets and vite-trails cli.js import each other under top-level await"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["vite-assets", "vite-trails"]
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

`bin/vite` (the vite-assets binstub, `exe/vite.ts`) never runs in an app that has vite-trails installed. Node prints `Warning: Detected unsettled top-level await` and exits without doing anything. Found while adopting vite-trails in trailmap (trailmap#151) at trails 1d8d3725a3.

The cause is an import cycle under top-level await:

- `packages/vite-assets/lib/cli.ts` ends with `await CLI.requireFrameworkLibraries("cli")`, which imports `@blazetrails/vite-trails/cli.js`.

- `packages/vite-trails/lib/cli.ts` imports `CLI` from `@blazetrails/vite-assets/cli.js`, which is still evaluating.

Rails: `vite_ruby/lib/vite_ruby/cli.rb:20-30` calls `ViteRuby::CLI.require_framework_libraries("cli")` at the bottom of the file. `vite_rails/lib/vite_rails/cli.rb:3` requires `vite_rails`, and Ruby's `require` of a file that is still loading returns `false` at once. So the cycle is harmless in Ruby. In ESM it deadlocks: a language difference, not a design choice.

## Converged shape

Keep the `require_framework_libraries("cli")` call at load time, but make the framework's extension import back into a module that has finished evaluating. Either:

- move the module-level call out of `cli.ts` into the binstub entry (`exe/vite.ts` already calls `cli.requireFrameworkLibraries()` before `start`, as `exe/vite:10` does), or

- have vite-trails' `cli.ts` import `CLI` from a module the cycle doesn't pass through.

Cite `vite_ruby/cli.rb:30` at the deviation.

## Acceptance criteria

- `bin/vite build` and `bin/vite version` run to completion in an app that depends on vite-trails.

- A test in vite-trails imports `@blazetrails/vite-assets/cli.js` with vite-trails installed and finishes.
