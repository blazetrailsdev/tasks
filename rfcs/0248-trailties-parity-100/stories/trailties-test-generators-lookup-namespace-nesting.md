---
title: "trailties-test-generators-lookup-namespace-nesting"
status: in-progress
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10770
claim: "2026-11-25T23:45:03Z"
assignee: "trailties-reload-rereads-database-config-for-use-postgresql"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `trailties-test-generators-lookup-remainder`, whose PR ported
`generators_test.rb:234` "rails root templates" (model file now rendered from
`templates/model.ts.tt`) and `:257` "usage with embedded ruby" (`Base.desc`
renders USAGE through `TSE`, `railties/lib/rails/generators/base.rb:41-49`).
Still missing in `packages/trailties/test/generators.test.ts`:

- `vendor/rails/v8.0.5.2/railties/test/generators_test.rb:114` find by namespace in subfolder,
  `:120` find by namespace with duplicated name, `:159` rails generators does not show
  active record hooks, `:165` default banner should show generator namespace. Rails derives a
  generator's namespace from its module nesting (`ActiveRecord::Generators::FixjourGenerator`
  -> `active_record:fixjour`, `Foobar::FoobarGenerator` -> `foobar:foobar`, fixtures under
  `vendor/rails/v8.0.5.2/railties/test/fixtures/lib/`). trails' `requireGenerator`
  (`packages/trailties/lib/generators.ts`, bottom of file) sets the namespace from the file's
  directory.

Also not yet ported: `railties/test/railties/generators_test.rb` (8),
`railties/test/application/generators_test.rb` (8), `railties/test/generators/generator_test.rb` (2),
`railties/test/generators/orm_test.rb` (2).

## Acceptance criteria

- [ ] Each test above is ported with its Rails name and body and passes, with the lib converged
      (namespace from Ruby nesting).
- [ ] No Miss left for the five files in `pnpm parity:test -- --package trailties`.
