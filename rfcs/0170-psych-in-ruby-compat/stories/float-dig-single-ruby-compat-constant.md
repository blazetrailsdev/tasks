---
title: "float-dig-single-ruby-compat-constant"
status: draft
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
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

Ruby has one `Float::DIG` (`vendor/ruby/v3.3.11/numeric.c:6283`). trails has a local `const FLOAT_DIG = 15` in three files: `packages/activemodel/src/type/decimal.ts`, `packages/activemodel/src/validations/numericality.ts` and `packages/activerecord/src/validations/numericality.ts`. Rails' `numericality.rb:36` (activemodel) and `:7` (activerecord) and `type/decimal.rb` each read `Float::DIG` directly.

The single home is a ruby-compat export carrying `@noRailsEquivalent PERMANENT`. That was tried on trails#8977, and `pnpm parity:api:extra:gate` red ruby-compat `novel 0 → 1`. The receipt is not read on an exported `const`. `extractFileConstants` (`scripts/api-compare/extract-ts-api.ts:4836`) keeps no JSDoc. `collectTaggedEntries` (`scripts/api-compare/extra-surface.ts:766`) pushes classes, modules, file functions and file-level tags, but no file constants. `extractInternalFileConstants` (`:4867`) already reads `@internal` off a const the same way.

## Acceptance criteria

- [ ] The extractor records a `@noRailsEquivalent` reason on an exported literal `const` (e.g. `fileConstantReceipts`), and `collectTaggedEntries` pushes it, with an extractor test.
- [ ] ruby-compat exports `FLOAT_DIG` (`Float::DIG`, citing `numeric.c:6283`) with a `PERMANENT` receipt, and the three local copies are deleted in favour of it.
- [ ] `pnpm parity:api:extra:gate` stays green.
