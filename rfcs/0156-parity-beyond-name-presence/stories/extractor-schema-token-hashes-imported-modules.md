---
title: "extractor schema token hashes every module extract-ts-api imports"
status: draft
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
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

## Context

`extractorSchemaToken` (`scripts/api-compare/extractor-schema.ts`) busts the content-keyed TS-API cache only when a file in `EXTRACTOR_SOURCES` changes. trails#10240 found that an edit to `invented-arm-tags.ts` left stale `inventedArms` in `ts-api.json` and in the shared cache, and added it and `missing-rails-name-tags.ts`. `extract-ts-api.ts` imports more modules that shape its output (`missing-rails-call-tags.ts`, `conventions.ts` helpers, and the other tag parsers). An edit to any of them silently serves stale extraction, locally and in CI.

## Acceptance criteria

- The token hashes every local module `extract-ts-api.ts` imports, transitively. Derive the list from the import graph, not by hand.
- `extractor-schema.test.ts` covers a change in a transitively imported module busting the token.
