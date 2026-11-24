---
title: "trailties: Erb::Generators port's class path is Tse::Generators, so namespace-from-class-name answers tse:"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-24T17:07:12Z"
assignee: "query-logs-pet-connection-in-request"
blocked-by: null
closed-reason: null
---

## Context

`require-generator-namespace-from-class-name` wants each generator's namespace to come from `Base.namespace` on its Ruby class path (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:54-57`, which calls `Thor::Base.namespace`, i.e. `Thor::Util.namespace_from_thor_class` = `snake_case(name)`). Rails' template-engine generators live under `module Erb` (`vendor/rails/v8.0.2/railties/lib/rails/generators/erb/scaffold/scaffold_generator.rb:6`), so `snake_case("Erb::Generators::ScaffoldGenerator")` gives `erb:scaffold`.

trails' generated class-path tables seat them as `TSE::Generators::*` (`scripts/api-compare/class-paths.ts:191-197` maps the `Erb` segment to `TOKEN_RENAMES.ERB`), e.g. `packages/trailties/lib/constants.tse-scaffold-scaffold-generator.generated.ts`. Thor's snake_case then yields `t_s_e:scaffold`, i.e. `t-s-e:scaffold`. Dropping the path-derived `klass.namespace(...)` in `requireGenerator` (`packages/trailties/lib/generators.ts:393-407`) broke 14 scaffold/authentication tests for this reason, and that change was reverted in trails#10528. `tse/controller` and `tse/mailer` avoid it only through `Object.defineProperty(..., "name", { value: "Tse::Generators::…" })`.

## Acceptance criteria

- [ ] The class path of the `Erb::Generators` port is `Tse::Generators::*`, the `Erb` → `Tse` token rename (`scripts/parity/conventions.ts:62`), so `Base.namespace` answers `tse:<name>`.
- [ ] The `Object.defineProperty(…, "name", …)` overrides in `tse/controller` and `tse/mailer` are removed.
- [ ] With `requireGenerator`'s namespace call removed, `test/generators.test.ts` and the scaffold, scaffold-controller and authentication generator tests pass.
