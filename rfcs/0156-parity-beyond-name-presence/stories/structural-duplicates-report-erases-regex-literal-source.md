---
title: "parity: the structural-duplicates report erases a regex literal's source"
status: draft
updated: 2026-10-03
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

`pnpm parity:structural-duplicates:report` still lists
`actionview/src/template/resolver.ts:245 escapeEntry` against ruby-compat's `regexpEscape`
(`packages/ruby-compat/src/regexp.ts:16`). It is a false positive: `escapeEntry` is a faithful port of
`entry.gsub(/[*?{}\[\]]/, '\\\\\\&')`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/resolver.rb`, `escape_entry`), which escapes
glob metacharacters, where `regexpEscape` escapes `/[.*+?^${}()|[\]\\]/`. Both bodies are one
`replace(<regex>, "\\$&")`, and `extractCallArgs` records a regex literal argument as `?`, which
`shapeOf` (`scripts/api-compare/report-structural-duplicates.ts`) drops. So the pattern, the only
thing that differs, is erased.

## Acceptance criteria

- [ ] `extractShapeTokens` (`scripts/api-compare/extract-ts-api.ts`) records a regex literal's source
      (for example `re:[*?{}[\]]/g`), with a test in `extract-ts-api.test.ts` and one in
      `report-structural-duplicates.test.ts` that fails on the current shape.
- [ ] `escapeEntry` no longer matches `regexpEscape`; a body with the same pattern still does.
- [ ] `pnpm parity:api:calls:args` is unchanged.
