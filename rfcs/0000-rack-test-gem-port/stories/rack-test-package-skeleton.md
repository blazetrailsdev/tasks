---
title: "Create packages/rack-test as a published workspace package"
status: draft
updated: 2026-09-03
rfc: "0000-rack-test-gem-port"
cluster: null
packages: []
deps: ["vendor-rack-test-source"]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 2 of the RFC. With the anchor vendored, create the TS package that
`parity:api` / `parity:test` will measure against it. Model on
`packages/rack-session/` throughout.

**It ships published, not devDependency-only, and not `private: true`** — the
RFC's "Published, not devDependency-only" section decides this and the reasons
are not to be re-derived here: `vendor/rails/actionpack/actionpack.gemspec:41`
is `add_dependency`, production code names `Rack::Test::UploadedFile` in
`PERMITTED_SCALAR_TYPES` (`vendor/rails/actionpack/lib/action_controller/metal/
strong_parameters.rb:1311`), and `Rack::Test::Methods` is public surface trails
users include in their own tests. `packages/website` is the only `private`
package in the repo and rack-test does not join it.

`packages/rack-session/package.json` is the template: `"name":
"@blazetrails/rack-test"`, `"version": "0.1.0"`, `"type": "module"`,
`main`/`types` under `dist/`, `"files": ["dist"]`, `"license": "MIT"`,
`"scripts": { "build": "tsc" }`. Dependencies: `@blazetrails/rack` only
(`rack-test.gemspec:28` — `s.add_dependency 'rack', '>= 1.3'`).

Four cross-package registrations, from where `rack-session` sits today:

- `pnpm-workspace.yaml` — covered by the `packages/*` glob, no edit.
- root `tsconfig.json` — a `{ "path": "packages/rack-test" }` reference beside
  `:30`.
- `vitest.config.ts:249-250` — **both** alias entries, the trailing-slash
  subpath one placed ABOVE the bare one.
- `vitest.dx-tests.config.ts` — both tsconfigs, if the package is referenced.

Src is a bare `src/index.ts` re-export point. **No port bodies in this story** —
`Session`, `Utils`, `CookieJar`, `UploadedFile` and `Methods` each have their
own port story.

## Acceptance criteria

- `packages/rack-test/package.json` exists as described, with **no**
  `"private": true`.
- `packages/rack-test/tsconfig.json` and `src/index.ts` exist; `pnpm typecheck`
  is green.
- The root `tsconfig.json` reference and both `vitest.config.ts` alias entries
  are present, subpath above bare.
- `packages/actionpack/package.json` gains a plain `dependencies` entry on
  `@blazetrails/rack-test`, mirroring `actionpack.gemspec:41`.
- A plain-node import of the **built** `packages/rack-test/dist/index.js` as an
  entry module succeeds, and so does a plain-node import of
  `packages/actionpack/dist/index.js` — the acyclicity check RFC Open Question 3
  asks for. A vitest run does not satisfy this.
