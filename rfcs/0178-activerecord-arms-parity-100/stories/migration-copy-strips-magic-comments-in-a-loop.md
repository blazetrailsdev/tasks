---
title: "activerecord: Migration#copy strips magic comments in a loop"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8482, which folds Ruby's `Kernel#loop` onto the `loop` skeleton token.

Rails' `Migration#copy`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1061-1110`) strips leading magic comments
from each source migration with `loop do source.sub!(...) { |magic_comment| magic_comments << magic_comment; "" } || break end`
at `:1077-1085`, so several stacked magic comments (`# frozen_string_literal:` then `# encoding:`) are all
moved ahead of the inserted "This migration comes from" comment.

trails' `Migration.copy` (`packages/activerecord/src/migration.ts:1053`) has no loop there.
`pnpm parity:api:arms:report --package=activerecord` reports `-loop +throw +if +if` for the pair. The missing
loop was hidden while `loop do` read as a plain `ref:loop` call.

## Acceptance criteria

- [ ] `copy` strips magic comments in a loop with Rails' break condition, as `migration.rb:1077-1085` does,
      or the body is shown to have no magic comments to strip in a `.ts` migration and the `-loop` is
      receipted or skipped through the settled mechanism.
- [ ] The `+throw +if +if` rows on `migration.ts#copy` are removed, or shown to be extractor false positives
      fixed with a unit test.
- [ ] The Rails `CopyMigrationsTest` magic-comment cases pass or are parked with a cited reason.
