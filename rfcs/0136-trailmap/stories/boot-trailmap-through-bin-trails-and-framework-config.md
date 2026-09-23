---
title: "Boot and configure trailmap through bin/trails and the framework's config surfaces"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
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

From the trailmap Rails-idiom audit. How trailmap boots and is configured
differs from what the trails generator now emits and from Rails. Some of it is
app-side and can land now; the rest waits on framework stories filed with this
one.

App-side, doable now:

- **The CLI is invoked by its `node_modules` path.** `package.json` scripts
  (`trails`, `dev`, `db:*`) and the `Dockerfile:65` `CMD` run
  `tsx node_modules/@blazetrails/trailties/bin/trails.js ...`. `bin/trails`
  already does exactly that. Rails' Dockerfile runs
  `CMD ["./bin/rails", "server"]`
  (`railties/lib/rails/generators/rails/app/templates/Dockerfile.tt:121`), and
  the README's "Running it" section should use `bin/trails server` the same
  way.
- **`config/application.ts` predates the generator's framework import.** The
  current template opens with `import "@blazetrails/trailties/all";`
  (`packages/trailties/src/generators/app-generator.ts:410`), the trails
  `require "rails/all"`. trailmap's `config/application.ts:1` has only
  `Application`.
- **Test that asserts the opposite of the code.**
  `test/initializers/tasks-database.test.ts:213-219`, "refuses a write,
  because trailmap is not the writer", expects a write to fail. But
  `config/database.ts:26-28` documents that `readonly` came off when the
  mutation endpoints landed. It only runs with a live `TASKS_DATABASE`, which
  is why CI has not caught it.

Waiting on framework stories (delete each workaround as its dependency lands
and is re-vendored):

- `config/application.ts:3-16`, the `LoadsDefaults` cast:
  `application-static-config-is-typed-as-the-trailtie-configuration` (0142).
- `app/controllers/health-controller.ts` plus `mapper.get("up", "health#show")`
  (`config/routes.ts:5`) become the framework's `"rails/health#show"` route:
  `rails-health-controller-is-unroutable-and-routes-template-omits-up` (0142).
  If the JSON body still matters to dokku, subclass the framework controller
  rather than re-implementing it.
- `config/fleet.ts` and `config/tasks-content.ts`, application settings read
  from `env` by hand, move to `config.x.fleet` / `configFor("fleet")`:
  `config-for-reads-only-database-and-config-x-is-unported` (0142).
- `config/environments/*.ts` and `config/initializers/filter-parameter-logging.ts`
  are inert as generated (their exports are never read). Regenerate them in the
  `configure` shape:
  `generated-environment-and-initializer-exports-are-never-read` (0142).
- `vite.config.ts:6-10` (`allowedHosts`) exists because production is served
  through the Vite dev server. That is `trails-server-ignores-the-environment`
  (0142). Once it lands, host allow-listing belongs in `config.hosts`
  (`packages/trailties/src/application/configuration.ts:34`) if trailmap wants
  it at all.

## Acceptance criteria

- `package.json` scripts, the `Dockerfile` `CMD` and the README invoke
  `bin/trails`, never the `node_modules` path. `scripts/smoke-boot.sh` still
  passes.
- `config/application.ts` imports `@blazetrails/trailties/all` as the
  generator does.
- The "not the writer" test is corrected to the writer contract (it asserts
  that a write succeeds) or deleted with the reason in the PR.
- For each framework dependency above that has landed and been re-vendored,
  its workaround is removed in the same PR as the bump or immediately after.
  The ones still open stay listed here.
