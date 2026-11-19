---
title: "Bundler.require requires every default dependency, with a require:false opt-out"
status: draft
updated: 2026-11-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
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

`Bundler::Runtime#require` (`vendor/ruby/v3.3.11/lib/bundler/runtime.rb:40-75`) requires every dependency in the requested groups. It honours `require: false` and `autorequire`, and falls back to the dash-to-slash namespaced file.

trails' `Bundler.require` (`packages/ruby-compat/lib/bundler.ts`, trails#10347) differs in three ways:

- It imports only the `@blazetrails/*` entries in `package.json` `dependencies`, and skips every other package.
- It has no `require: false` arm.
- Only the `:default` group requires anything.

## Converged shape

- A per-dependency opt-out takes the place of `require: false`, for example a `trails.require` map in `package.json` naming packages not to import.
- Every `:default` dependency is imported unless it is opted out.
- The namespaced-file fallback (`runtime.rb:62-70`) and `GemRequireError` wrapping (`runtime.rb:57-58`) are ported.

## Acceptance criteria

- The `@blazetrails/` prefix filter is gone.
- `bundler.trails.test.ts` covers the opt-out arm.
