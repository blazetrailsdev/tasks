---
title: "vite-assets identifiers follow the vite_ruby→vite_assets / yarn→pnpm conventions"
status: claimed
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: ["vite-assets"]
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: "2026-11-15T22:51:38Z"
assignee: "vite-assets-names-follow-vite-assets-convention"
blocked-by: null
closed-reason: null
---

## Problem

`pnpm parity:api vite-assets` on origin/main (2026-11-15) reports 207/212 methods and 92/95 params. Four of the gaps come from `scripts/parity/conventions.ts`, which maps `vite_ruby` to `vite_assets` (`PHRASE_RENAMES`) and the `yarn` token to `pnpm`. The TS port still spells the Ruby names:

- `build.ts`: Struct member `vite_ruby` is declared as `viteRuby`. The comparator expects `viteAssets` and `setViteAssets` (missing: `ViteRuby::Build#vite_ruby`, `#vite_ruby=`).
- `builder.ts`, `commands.ts`, `runner.ts`: the constructor param is `viteRuby`, but Rails' `initialize(vite_ruby)` expects `viteAssets` (the 3 param-name mismatches).
- `commands.ts`: `isLegacyYarnVersion`. The comparator expects `isLegacyPnpmVersion` for `legacy_yarn_version?`.

## Fix

Rename the TS identifiers to the convention spellings. The `MEMBERS` JSON key stays `vite_ruby`, because the build metadata file is shared with vite-plugin-ruby. If renaming the yarn check to pnpm misdescribes the behaviour, record that one as a scoped exception in the comparator instead of renaming it, and give the reason.

## Done when

`pnpm parity:api vite-assets` shows no missing methods for build.rb `vite_ruby`/`vite_ruby=` or commands.rb `legacy_yarn_version?`, and params are at 95/95.
