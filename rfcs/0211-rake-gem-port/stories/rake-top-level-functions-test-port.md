---
title: "rake-top-level-functions-test-port"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
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

`test/test_rake_top_level_functions.rb` was left out of `rake-application-top-level-run` to hold the 800 LOC ceiling. `DSL.namespace` (`packages/rake/src/dsl-definition.ts:55`), `DSL.import` (`:73`) and `FileUtilsExt.whenWriting` (`packages/rake/src/file-utils-ext.ts:89`) are already ported. The test swaps `Rake.application` for an object whose `method_missing` records calls; `test_missing_other_constant` (`:68-70`) has no port under CLAUDE.md § "Constant lookup is an import or a registry".

## Acceptance criteria

- [ ] `test_rake_top_level_functions.rb` ports as `packages/rake/src/test-rake-top-level-functions.test.ts`, names matching for `parity:test`.
- [ ] `test_missing_other_constant` is parked under a `PERMANENT-SKIP:` line citing that section.
