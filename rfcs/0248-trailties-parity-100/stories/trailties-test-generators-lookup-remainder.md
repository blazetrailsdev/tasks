---
title: "trailties-test-generators-lookup-remainder"
status: done
updated: 2026-11-22
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10589
claim: "2026-11-22T19:14:07Z"
assignee: "engine-controllers-resolve-for-unused-routes"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `trailties-test-generators-lookup`. Its bundle PR ported 15 of `vendor/rails/v8.0.2/railties/test/generators_test.rb`'s missing tests into `packages/trailties/test/generators.test.ts`. Still missing:

- `generators_test.rb:114` find by namespace in subfolder, `:120` find by namespace with duplicated name, `:159` rails generators does not show active record hooks, `:165` default banner should show generator namespace. Rails derives a generator's namespace from its module nesting (`ActiveRecord::Generators::FixjourGenerator` -> `active_record:fixjour`, `Foobar::FoobarGenerator` -> `foobar:foobar`, fixtures under `vendor/rails/v8.0.2/railties/test/fixtures/lib/`). trails' `requireGenerator` (`packages/trailties/lib/generators.ts`, bottom of file) sets the namespace from the file's directory, which yields `active-record` and `foobar`.
- `:234` rails root templates: `ActiveRecord::Generators::ModelGenerator#create_model_file` renders `template "model.rb"` (`railties/lib/rails/generators/active_record/model/model_generator.rb`); trails' `packages/trailties/lib/generators/active-record/model/model-generator.ts` writes the file inline, so an app `lib/templates/active_record/model/model.ts` override is never read.
- `:257` usage with embedded ruby: `Base.desc` renders USAGE through `ERB.new(...).result(binding)` (`railties/lib/rails/generators/base.rb:41-49`); trails' `Base.desc` (`packages/trailties/lib/generators/base.ts`) reads it raw.

Also not yet ported (from the original story): `railties/generators_test.rb` (8), `application/generators_test.rb` (8), `generators/generator_test.rb` (2), `generators/orm_test.rb` (2). `source paths for not namespaced generators` stays with `port-source-paths-for-not-namespaced-generators-test`.

## Acceptance criteria

- [ ] Each test above is ported with its Rails name and body and passes, with the lib converged (namespace from Ruby nesting, `template("model.ts")`, USAGE rendered as a template).
- [ ] No Miss left for the five files in `pnpm parity:test -- --package trailties`.
