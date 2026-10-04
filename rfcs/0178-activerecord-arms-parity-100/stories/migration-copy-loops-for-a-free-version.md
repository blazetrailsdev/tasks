---
title: "activerecord: Migration#copy loops for a free version number"
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
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1061-1110`) picks a free version number with
`loop do ... end` at `:1077`, breaking once no existing migration holds the candidate version.

trails' `Migration.copy` (`packages/activerecord/src/migration.ts:1053`) has no loop there.
`pnpm parity:api:arms:report --package=activerecord` reports `-loop +throw +if +if` for the pair. The missing
loop was hidden while `loop do` read as a plain `ref:loop` call.

## Acceptance criteria

- [ ] `copy` iterates as `migration.rb:1077` does, with Rails' break condition, so a copied migration whose
      version collides with an existing one is bumped until it is free.
- [ ] The arms report has no `-loop` on `migration.ts#copy`, and the `+throw +if +if` rows are removed or
      shown to be extractor false positives fixed with a unit test.
- [ ] The Rails `CopyMigrationsTest` cases that exercise a version collision pass.
