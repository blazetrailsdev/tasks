---
title: "parity-included-module-methods-credited-to-includer-file"
status: draft
updated: 2026-09-17
rfc: "0156-parity-beyond-name-presence"
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

`scripts/parity/conventions.ts` SCOPED_SKIP_GROUPS carries a `concerning`/`concern`
entry scoped to `core_ext/module/aliasing.rb` (added in trails#7850). The Rails API
extractor credits methods of an included module to the including class under that
class's first file: `class Module; include Concerning; end`
(`vendor/rails/activesupport/lib/active_support/core_ext/module/concerning.rb:136`)
makes `Module::Concerning#concern`/`#concerning` (`concerning.rb:114`, `:132`)
expected in `aliasing.rb`, which defines only `alias_attribute` (`aliasing.rb:21`).
They are ported and matched at `packages/activesupport/src/core-ext/module/concerning.ts`.

## Acceptance criteria

- The parity mapper (scripts/api-compare extractor/compare) does not credit an
  included module's instance methods to the includer's first file when the module is
  defined in its own file.
- The scoped skip entry for `concerning`/`concern` on aliasing.rb is removed and
  `pnpm parity:api --package activesupport` reports no gap for `aliasing.rb`.
