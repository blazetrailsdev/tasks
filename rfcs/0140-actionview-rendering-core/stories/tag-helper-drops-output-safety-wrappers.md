---
title: "tag-helper.ts re-exports raw/safeJoin/toSentence wrappers that TagHelper's include OutputSafetyHelper (tag_helper.rb:18) already provides"
status: draft
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
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

`TagHelper` does `include CaptureHelper` and `include OutputSafetyHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb:17-18`). Since trails#8268 the `TagHelper` Module in `packages/actionview/src/helpers/tag-helper.ts` does `mod.include(OutputSafetyHelper)`, so `raw` / `safe_join` / `to_sentence` reach includers through the ancestry.

But `tag-helper.ts` still exports its own `raw`, `safeJoin` and `toSentence` wrappers, which delegate to `output-safety-helper.ts`'s `_raw` / `_safeJoin` / `_toSentence`. Rails' tag_helper.rb defines none of them, so they are invented duplicate surface, left from when the file could not include the module.

## Converged shape

Delete the three wrappers from `tag-helper.ts`. Callers that import them from `./tag-helper.js` import from `./output-safety-helper.js` instead, or reach them through the included Module.

## Acceptance criteria

- `tag-helper.ts` exports no `raw`, `safeJoin` or `toSentence`.
- `parity:api:extra --package actionview` drops the three moved names for tag-helper.ts.
