---
title: "Create packages/rack-cache as a published workspace package"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["vendor-rack-cache-source"]
deps-rfc: []
est-loc: 180
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 2 of the RFC. Model on `packages/rack-test/` throughout
(`packages/rack-test/package.json`: `"version": "0.1.0"`, `"type": "module"`,
`main`/`types` under `dist/`, `"files": ["dist"]`, `"license": "MIT"`,
`"scripts": { "build": "tsc" }`, and no `"private": true`).

**Dependencies.** `@blazetrails/rack` is the gem's one runtime dependency
(`rack-cache.gemspec`: `s.add_dependency 'rack', '>= 0.4'`).
`@blazetrails/ruby-compat` covers the stdlib it requires: `fileutils` and
`digest/sha1` (`vendor/rack-cache/v1.17.0/lib/rack/cache/meta_store.rb:1-2`,
`entity_store.rb:1`) and `uri` (`storage.rb:2`). There is no
`@blazetrails/activesupport` edge here. The gem requires no ActiveSupport, and
the one edge the RFC anticipates (the `Marshal` stand-in for `MetaStore::Disk`,
RFC Open question 2) is added by `port-rack-cache-disk-stores` if that story
takes it. The npm memcached client is **not** added here. It is an optional
peer that `port-rack-cache-memcache-stores` adds.

**actionpack and trailties do not gain a dependency in this story.** Unlike
`rack-test-package-skeleton`, which added a plain `dependencies` edge from
actionpack to mirror `actionpack.gemspec:41`, rack-cache is Gemfile-only
(`vendor/rails/v8.0.2/Gemfile:18`). The RFC's "Package shape" decides that
actionpack and trailties take it as an optional peer plus a workspace
devDependency. Those edges land with the stories that first import it:
`port-rails-meta-and-entity-stores` and `default-middleware-stack-omits-rack-cache`.

Cross-package registrations, from where `rack-test` sits today:

- `pnpm-workspace.yaml`: the `packages/*` glob covers it, so no edit.
- Root `tsconfig.json`: add `{ "path": "packages/rack-cache" }` beside the
  rack-test reference (`tsconfig.json:32`).
- `vitest.config.ts:307-308`: add **both** alias entries, with the
  trailing-slash subpath entry above the bare one.
- `vitest.dx-tests.config.ts`: both tsconfigs, if the package is referenced.

Src is `src/index.ts` plus **one real port**, `src/version.ts`, which is the
whole of `vendor/rack-cache/v1.17.0/lib/rack/cache/version.rb` (5 lines,
`VERSION = '1.17.0'`). This gives `index.ts` something to export rather than an
empty stub (CLAUDE.md). `packages/rack-test/src/version.ts` and its test are the
model. No other bodies land here.

A package with a test file must be wired into a CI lane in the same PR or
`scripts/ci-suite-coverage.test.ts` turns red. That happened to
`rack-test-package-skeleton` (see `register-rack-test-in-ci-lanes`). Land the
`RACK_PKGS_RE`, "Rack tests" step and coverage-list registrations here if the
guard demands them, and leave the rest to `register-rack-cache-in-ci-lanes`.

## Acceptance criteria

- [ ] `packages/rack-cache/package.json` exists as described, with no
      `"private": true`, and declares `@blazetrails/rack` and
      `@blazetrails/ruby-compat` as its only workspace dependencies.
- [ ] `packages/rack-cache/tsconfig.json`, `src/index.ts`, `src/version.ts` and
      `src/version.test.ts` exist, and `pnpm typecheck` is green.
- [ ] The root `tsconfig.json` reference and both `vitest.config.ts` alias
      entries are present, with the subpath entry above the bare one.
- [ ] `packages/actionpack/package.json` and `packages/trailties/package.json`
      are unchanged.
- [ ] A plain-node import of the built `packages/rack-cache/dist/index.js`, used
      as the entry module, succeeds.

## Definition of done

Adding a plain `dependencies` edge from actionpack or trailties does not close
this story. The RFC decides the optional-peer shape and cites
`vendor/rails/v8.0.2/Gemfile:18`.
