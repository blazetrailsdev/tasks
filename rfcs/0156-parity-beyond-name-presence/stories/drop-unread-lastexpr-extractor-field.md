---
title: "Drop the unread lastExpr field from the Ruby API extractor"
status: done
updated: 2026-09-30
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8255
claim: "2026-09-29T18:17:43Z"
assignee: "generated-application-layout-is-not-a-port-of-the-rails-template"
blocked-by: null
closed-reason: null
---

## Context

trails#8098 replaced the void-return report's body-shape filter
(`MethodInfo.lastExpr`, emitted by
`scripts/api-compare/extract-ruby-api.rb#body_last_expr`) with a caller-based
one (`scripts/api-compare/extract-return-uses.rb`). `lastExpr` now has no
reader: `scripts/parity/types.ts` still declares it, the extractor still emits
it on every Ruby method, and `extract-ruby-api.test.ts` still pins it
("records the kind of each body's final expression as lastExpr").

## Acceptance criteria

- `body_last_expr`, the `entry[:lastExpr]` write, the `lastExpr` field in
  `scripts/parity/types.ts`, and its extractor test are removed.
- `pnpm parity:api --calls` and `pnpm parity:api:returns` still run.
