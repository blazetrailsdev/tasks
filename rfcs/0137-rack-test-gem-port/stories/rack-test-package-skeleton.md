---
title: "Create packages/rack-test as a published workspace package"
status: draft
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
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
`"scripts": { "build": "tsc" }`.

**Dependencies: the same three `packages/rack-session/package.json` declares** —
`@blazetrails/rack`, `@blazetrails/ruby-compat`, `@blazetrails/activesupport`.
`rack-test.gemspec:28` declares only `rack '>= 1.3'`, but a gemspec does not
declare the stdlib and rack-test requires six stdlib files: `tempfile`
(`uploaded_file.rb:4`, `Tempfile.new` at `:92`), `stringio`
(`uploaded_file.rb:5`, `when StringIO` at `:36`), `fileutils`
(`uploaded_file.rb:3`), `uri` (`test.rb:3`, `cookie_jar.rb:3`; `Session#parse_uri` at `test.rb:271`),
`time` (`cookie_jar.rb:4`) and `forwardable` (`test.rb:21`, `methods.rb:3`).
`StringIO` and `FileUtils` are ruby-compat's
(`packages/ruby-compat/src/string-io.ts:20`, `index.ts:41`); `Tempfile` is
still `packages/activesupport/src/tempfile.ts`, because
`0129-ruby-compat/move-tempfile-to-ruby-compat` is **`blocked`** on the
fs/os/crypto adapter seat. Do not wait on it and do not re-home `Tempfile`
here: import the one that exists, as `packages/rack/src/mock-request.ts:21` and
`packages/rack/src/multipart/parser.ts:1` already do. That story's sweep drops
the `activesupport` edge when it lands.

Four cross-package registrations, from where `rack-session` sits today:

- `pnpm-workspace.yaml` — covered by the `packages/*` glob, no edit.
- root `tsconfig.json` — a `{ "path": "packages/rack-test" }` reference beside
  `:30`.
- `vitest.config.ts:249-250` — **both** alias entries, the trailing-slash
  subpath one placed ABOVE the bare one.
- `vitest.dx-tests.config.ts` — both tsconfigs, if the package is referenced.

Src is `src/index.ts` plus **one real port**: `src/version.ts`, the whole of
`vendor/rack-test/lib/rack/test/version.rb` (5 lines,
`VERSION = '2.2.0'.freeze`). It lands here rather than in a story of its own
because it is a single frozen constant with no behaviour, and because it gives
`index.ts` something to export instead of being an empty file — which CLAUDE.md
forbids ("do NOT add empty stubs or placeholder interfaces"). Model it on
`packages/rack/src/version.ts`, which exports `RELEASE` / `release` and aliases
`VERSION` in `packages/rack/src/index.ts:1-2`, and mirror its
`version.test.ts`.

**No other port bodies in this story** — `Session`, `Utils`, `CookieJar`,
`UploadedFile` and `Methods` each have their own port story.

## Acceptance criteria

- [ ] `packages/rack-test/package.json` exists as described, with **no**
  `"private": true`, and declares `@blazetrails/rack`,
  `@blazetrails/ruby-compat` and `@blazetrails/activesupport` — not `rack`
  alone.
- [ ] `packages/rack-test/tsconfig.json` and `src/index.ts` exist; `pnpm typecheck`
  is green.
- [ ] The root `tsconfig.json` reference and both `vitest.config.ts` alias entries
  are present, subpath above bare.
- [ ] `packages/actionpack/package.json` gains a plain `dependencies` entry on
  `@blazetrails/rack-test`, mirroring `actionpack.gemspec:41`.
- [ ] A plain-node import of the **built** `packages/rack-test/dist/index.js` as an
  entry module succeeds, and so does a plain-node import of
  `packages/actionpack/dist/index.js` — the acyclicity check RFC Open Question 3
  asks for. A vitest run does not satisfy this.

## Definition of done

Marking `packages/rack-test` `"private": true`, or moving the actionpack
dependency into `devDependencies`, does not close this story — the RFC's
"Published, not devDependency-only" section decides that and cites
`actionpack.gemspec:41` and `strong_parameters.rb:1311`. Re-home `Tempfile`
here and the story is also not closed: that is
`0129-ruby-compat/move-tempfile-to-ruby-compat`, and it is blocked.
