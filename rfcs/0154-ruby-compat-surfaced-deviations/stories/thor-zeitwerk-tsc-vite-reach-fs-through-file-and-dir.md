---
title: "thor-zeitwerk-tsc-vite-reach-fs-through-file-and-dir"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
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

Split from `retire-getfs-and-getpath-public-exports`. These lib callers still
use ruby-compat's `getFs()` / `getPath()`:

- thor: `actions.ts`, `actions/create-file.ts`, `actions/file-manipulation.ts`,
  `actions/inject-into-file.ts` (+3 tests) — `vendor/thor/.../actions/*.rb`
  use `File` / `FileUtils`.
- zeitwerk: `loader.ts`, `registry.ts`, `core-ext/kernel.ts`,
  `loader/manifest.ts`, `loader/config.ts` (+2 tests).
- trails-tsc: `build-autoload.ts`, `build-views.ts`, `build-templates.ts`.
- vite-assets: `builder.ts:118` `getFs().stat!(file)` for `File.stat(file)`
  (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/builder.rb:77`). ruby-compat
  `File` has only a sync `stat`, so this needs a `File.statAsync` beside the
  other `*Async` members in `packages/ruby-compat/lib/file.ts`.

## Acceptance criteria

- None of those packages imports `getFs` / `getPath`; each call uses the async
  `File` / `Dir` / `FileUtils` member its Ruby line names.
- Touched tests stay green.
