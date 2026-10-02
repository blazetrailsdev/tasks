---
title: "Create packages/actioncable as a published workspace package and wire it into CI"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: []
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

There is no `packages/actioncable`. The package is `@blazetrails/actioncable`
at `packages/actioncable`: Rails ships Action Cable as its own gem and every
trails package takes its gem's name.

Model it on `packages/globalid/`: published (no `"private": true`),
`"version": "0.1.0"`, `"type": "module"`, `main` / `types` under
`dist/`, `"files": ["dist"]`, `"scripts": { "build": "tsc" }`.

**Dependencies** mirror the gemspec (`vendor/rails/v8.0.2/actioncable/actioncable.gemspec:35-40`):

- `activesupport`, `actionpack` → `@blazetrails/activesupport`,
  `@blazetrails/actionpack`, plus `@blazetrails/ruby-compat` and
  `@blazetrails/rack`.
- `websocket-driver` → the npm `websocket-driver` as an **optional peer**
  (the `pg` / `mysql2` precedent in `packages/activerecord/package.json`)
  and a devDependency. It is added by
  `port-actioncable-connection-client-socket-and-web-socket`, not here.
- `nio4r` → nothing (RFC "Parity plan", Tier 3).
- `zeitwerk` → nothing (CLAUDE.md § "Trails has no autoloader").
- **No `@blazetrails/activerecord`, `@blazetrails/globalid`,
  `@blazetrails/actionview` or `@blazetrails/trailties` edge.** Action Cable
  reaches each of those through a call-time constant or a duck-typed method.

**Src is three real ports, not stubs:** `src/gem-version.ts` and
`src/version.ts` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/gem_version.rb`, 19 lines; `version.rb`, 12) and
`src/deprecator.ts` (`deprecator.rb:6-8`: `ActiveSupport::Deprecation.new`
as `ActionCable.deprecator`), with `src/index.ts` exporting them.

**Registrations.** Each one that is missing reds a different CI lane, one round
at a time, and `pnpm typecheck` stays green locally because husky leaves a
built `dist/`. Take the list from the most recent new-package PR
(`0169/activejob-package-skeleton` if it has landed, else `packages/rack-test`
in trails#7453) and confirm each line still exists:

- `pnpm-workspace.yaml` and the root `tsconfig.json` reference;
- `vitest.config.ts`: both alias entries, the trailing-slash subpath entry
  above the bare one, and the website's vitest alias, which is a prefix match;
- `packages/activerecord/dx-tests/tsconfig.json` and
  `packages/activerecord/virtualized-dx-tests/tsconfig.json` `paths`;
- `packages/activesupport/src/cache/file-store-lock-worker-hooks.trails.mjs`:
  confirm it resolves the new package generically;
- `.github/workflows/ci.yml`: a gate of its own for the package,
  `ACTIONCABLE_PKGS_RE`, beside `RACK_PKGS_RE` (`:122`), matching
  `packages/actioncable` and the packages it depends on (activesupport,
  actionpack, rack, ruby-compat), with a `set_gate` line (`:290-295`) and
  a `pnpm vitest run packages/actioncable` step it controls; plus the
  coverage package list. **Do not add actioncable to `AP_PKGS_RE`
  (`:117`)**: actionpack does not depend on it, and doing so would run the
  ActionPack suite on every actioncable-only diff. It joins
  `TRAILTIES_PKGS_RE` (`:119`) in `port-actioncable-engine`, when
  trailties first imports it, not here. Update
  `scripts/ci-suite-coverage.test.ts`'s fixture literals if the edited
  `run:` line is one they `.replace()`.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/version.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/gem_version.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/deprecator.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`ActionCable.deprecator` is memoized** (`@deprecator ||=`), one instance for the process. The engine registers that same instance in `app.deprecators`.
- [ ] **A missing `ci.yml` lane fails `scripts/ci-suite-coverage.test.ts` in Unit Tests**, not in the lane you forgot.
- [ ] **The gate lists dependencies, not dependents.** A change to activesupport must run the actioncable tests; a change to actioncable must not run activesupport's.

## Acceptance criteria

- [ ] `packages/actioncable/package.json` exists as described, with no `"private": true` and none of the four excluded dependencies.
- [ ] `gem-version.ts`, `version.ts` and `deprecator.ts` port their Ruby files, each with a test.
- [ ] Every registration above is present; `scripts/ci-suite-coverage.test.ts`, `pnpm test:types` and `pnpm test:types:virtualized` are green (not only `pnpm typecheck`).
- [ ] A plain-node import of the built `packages/actioncable/dist/index.js` as the entry module succeeds.

## Definition of done

An empty `src/index.ts`, or an `@blazetrails/activerecord` dependency, does not close this story.

## Verification

```bash
pnpm build && node -e "import('./packages/actioncable/dist/index.js')"
pnpm vitest run packages/actioncable scripts/ci-suite-coverage.test.ts
pnpm test:types && pnpm test:types:virtualized
```
