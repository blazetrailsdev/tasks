---
title: "Website build fails on main; fix it, exercise the Psych stub, re-enable the CI job"
status: draft
updated: 2026-10-04
rfc: "0061-ci-failures"
cluster: null
packages: []
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

Found while verifying trails PR 8476. The `website` job is switched off in
`.github/workflows/ci.yml` ("TEMPORARILY DISABLED. The build has been failing
on main", a leading `false &&` in its `if:`). On `origin/main` at 014c36a4e4
both builds fail locally, in sequence:

1. `pnpm --filter @blazetrails/website build:sw`: `vite.sw.config.ts` aliases
   `^@blazetrails/activerecord/(.+)$` to `../activerecord/src/$1.ts`, and
   `packages/trailties/src/database.ts:294-344` imports
   `@blazetrails/activerecord/connection-adapters/<name>-adapter.js`, so the
   alias resolves `…-adapter.js.ts` (ENOENT). Five specifiers.
2. With those bypassed, the SW bundle then stops on named imports from `path`
   and `fs` (`import { basename, dirname, … } from "path"`,
   `import * as nativeFs from "fs"`), which the config externalizes.
3. `vite build` (the app) stops on a top-level await in the libxml2 wasm
   loader (`const libxml2 = await Module()`), reached through nokogiri.

PR 8476 repointed the YAML stub (`src/stubs/yaml-stub.ts`, the
`stub-psych-adapter` plugin in `vite.config.ts` and `vite.sw.config.ts`) at
`@blazetrails/ruby-compat/psych-adapter`. Those edits have never been bundled,
because the build fails before reaching them.

## Acceptance criteria

- [ ] `build:sw` and `vite build` pass on main; the SW alias strips a `.js`
      suffix before appending `.ts`, or the specifiers lose it.
- [ ] The Psych stub is exercised: the SW bundle contains no top-level await
      from `ruby-compat/dist/psych-adapter.js`, and `Psych.dump` works in the
      sandbox.
- [ ] The `false &&` is removed from the `website` job's `if:` in
      `.github/workflows/ci.yml`.
