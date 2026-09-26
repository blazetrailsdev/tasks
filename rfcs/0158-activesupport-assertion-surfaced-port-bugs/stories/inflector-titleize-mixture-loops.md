---
title: "inflector-titleize-mixture-loops"
status: draft
updated: 2026-09-26
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

The Ruby test extractor now expands
`MixtureToTitleCase.each_with_index do |(before, titleized), index|`
(`vendor/rails/v8.0.2/activesupport/test/inflector_test.rb:123-128`) and the
`MixtureToTitleCaseWithKeepIdSuffix` loop at `:130-135` into
`titleize mixture to title case <i>` / `titleize with keep id suffix mixture to
title case <i>` (21 tests). trails' `packages/activesupport/src/inflector.test.ts`
ports the first as one hand-written `it("titleize mixture to title case")` with
five assertions, and the second not at all.

`MixtureToTitleCase` is imported from `inflector-test-cases.ts`, so a TS loop
over it cannot be statically titled by `scripts/test-compare/extract-ts-core.ts`
(`staticIterableElements` resolves same-file declarations only).

## Acceptance criteria

- `inflector.test.ts` ports both loops as loops over the imported constants,
  titled `titleize mixture to title case ${index}` etc.
- The TS extractor resolves the imported constant (the TS twin of the Ruby
  extractor's `require_relative` constant loading) so both families match.
- `inflector_test.rb` has 0 missing among those families.
