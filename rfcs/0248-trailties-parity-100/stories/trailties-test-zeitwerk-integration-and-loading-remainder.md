---
title: "trailties-test-zeitwerk-integration-and-loading-remainder"
status: draft
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

`trailties-test-zeitwerk-and-loading` ported `zeitwerk_inflector_test.rb` (2), `zeitwerk_checker_test.rb` (6) and 9 of the 20 `zeitwerk_integration_test.rb` tests into `packages/trailties/test/application/zeitwerk-*.test.ts`, on the isolation harness (`packages/trailties/test/support/isolation/abstract-unit.ts`). Each isolation test costs ~30s, so the remainder is its own PR.

Still Miss:

- `vendor/rails/v8.0.5.2/railties/test/application/zeitwerk_integration_test.rb`: "autoloaders inflect with Active Support" (:33), "root directories manually set by the user are honored (once)" (:58) and "(main)" (:79), "the once autoloader can autoload from initializers" (:101), "the once autoloader can eager load" (:136), "eager loading loads the application code if invoked manually too (regression test)" (:162; trails boot always eager loads, packages/trailties/CLAUDE.md "The application loader is Zeitwerk"), "eager loading loads code in engines" (:200), "eager loading loads anything managed by Zeitwerk" (:213), "autoload directories not present in eager load paths are not eager loaded" (:232), "reloading eager loads again, if enabled" (:300), "reloading clears autoloaded tracked classes" (:313). Append to `packages/trailties/test/application/zeitwerk-integration.test.ts`.
- `vendor/rails/v8.0.5.2/railties/test/application/loading_test.rb`: every test except "reload constants on development" and "added files (like db/schema.rb) also trigger reloading", which `packages/trailties/test/application/loading.test.ts` already has.

## Acceptance criteria

- [ ] No Miss left for `zeitwerk_integration_test.rb` or `loading_test.rb` in `pnpm parity:test -- --package trailties`.
- [ ] A test that cannot pass because boot eager loads is `it.skip` under a `PERMANENT-SKIP:` line citing packages/trailties/CLAUDE.md, "The application loader is Zeitwerk".
- [ ] Lib fixes the ports need land in the same PR.
