---
title: "Extractor: a function returning a class must not suppress the synthesized file module"
status: in-progress
updated: 2026-10-27
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9385
claim: "2026-10-27T20:06:22Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ts-api.ts:1084-1201` treats any exported function whose return type has construct signatures as a mixin. It then sets `fileHasClassOrModule = true`, which stops the synthesized file module from being created at `:1503-1520`. When that happens, a top-level `mattrAccessor.call(Testing, …)` has no module to credit, even on its deferred retry (`:1241-1260`).

trails#9383 ran into this in `packages/actionview/src/rails-dom-testing/testing.ts`, the port of `vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing.rb:11-48`. `htmlDocument` and `htmlDocumentFragment` return Nokogiri classes, and `mattr_accessor :default_html_version` scored as missing. The workaround was an `export interface Testing` merged with the const. That workaround exists only for the extractor.

## Acceptance criteria

- A plain exported function that returns a class (and does not define one) no longer suppresses the synthesized file module. A `mattrAccessor.call(<file module>, …)` credits it.
- The `interface Testing` in `rails-dom-testing/testing.ts` goes back to a type literal and still scores 8/8 on `testing.rb`.
- `pnpm parity:api` totals do not drop in any package.
