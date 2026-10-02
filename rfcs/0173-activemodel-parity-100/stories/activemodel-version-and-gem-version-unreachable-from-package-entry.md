---
title: "activemodel: ActiveModel.version / gem_version / VERSION are not exported from the package entry"
status: claimed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-10-02T15:41:59Z"
assignee: "action-dispatch-assertions-is-not-an-includable-module"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel.version` (`vendor/rails/v8.0.2/activemodel/lib/active_model/version.rb:7-9`),
`ActiveModel.gem_version` and `ActiveModel::VERSION`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/gem_version.rb:5-17`) are public API on the
`ActiveModel` module.

trails ports them in `packages/activemodel/src/version.ts` and `gem-version.ts` (trails PR 8363),
but `packages/activemodel/src/index.ts` exports neither, so a consumer of
`@blazetrails/activemodel` cannot call them. activesupport already does
(`packages/activesupport/src/index.ts`: `export { VERSION, gemVersion } from "./gem-version.js"`).

## Acceptance criteria

- [ ] `index.ts` exports `version`, `gemVersion` and `VERSION`.
- [ ] A test imports them from the package entry and asserts `version()` is the `Gem.Version`
      `gemVersion()` answers.

## Verification

```bash
pnpm build && pnpm vitest run packages/activemodel/src/version.trails.test.ts && pnpm test:types
```
