---
title: "trailties-test-application-routing-reload-and-draw"
status: ready
updated: 2026-11-22
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

trailties-test-application-routing ported 24 of the 32 tests in `vendor/rails/v8.0.2/railties/test/application/routing_test.rb` into `packages/trailties/test/application/routing.test.ts`. The 8 below failed against `packages/trailties/lib`. They were left out to keep that PR under the LOC ceiling. Each failure is from a port written in the file's conventions:

| Rails test (`routing_test.rb`)                                               | Failure                                                                                                                                 |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `root takes precedence over internal welcome controller` (:62)               | `Rack#assertWelcome` (`test/support/isolation/abstract-unit.ts`) calls `this.assertEqual`, which an activesupport `TestCase` host lacks |
| `routes appending blocks after reload` (:317)                                | `config.beforeEagerLoad` block receives `undefined` for `app` ("Cannot read properties of undefined (reading 'config')")                |
| `routes drawing from config/routes` (:342)                                   | `draw :external` from `config/routes/external.ts` routes nothing: `/success/index` renders the 404 page                                 |
| `reloads routes when configuration is changed in #{mode}` (:370, both modes) | same `draw` failure: `/foo` 404s                                                                                                        |
| `routes are added and removed when reloading` (:511)                         | after `reload_routes!`, a `direct(:custom)` route 404s (`/custom`)                                                                      |
| `named routes are cleared when reloading` (:631)                             | `url_helpers.polymorphic_path` / `direct` helper: "Cannot read properties of undefined (reading 'apply')"                               |
| `reloading routes removes methods and doesn't undefine them` (:734)          | after a reload adds `foo_path`, a class that included `url_helpers` still answers `UrlHelpers#foo_path` ("/foo", expected "/bar")       |

## Acceptance criteria

- [ ] Fix the lib gaps above (`Mapper#draw` route-file lookup, `beforeEagerLoad` argument, `direct`/`resolve` across reload, url_helpers write-through to includers per root CLAUDE.md § "A method defined on a module after it is included").
- [ ] Port all 8 tests into `routing.test.ts` with their Rails names. No Miss left for `application/routing_test.rb` in `pnpm parity:test -- --package trailties`.
