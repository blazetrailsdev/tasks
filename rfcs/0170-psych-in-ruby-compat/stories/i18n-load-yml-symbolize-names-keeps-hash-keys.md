---
title: "i18n-load-yml-symbolize-names-keeps-hash-keys"
status: in-progress
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8992
claim: "2026-10-16T19:44:53Z"
assignee: "i18n-load-yml-symbolize-names-keeps-hash-keys"
blocked-by: null
closed-reason: null
---

## Context

Vendored i18n's `load_yml` (`vendor/i18n/lib/i18n/backend/base.rb:261-267`) calls
`YAML.unsafe_load_file(filename, symbolize_names: true, freeze: true)` and returns
`keys_symbolized = true`, so `store_translations` (`backend/simple.rb:36-46`) skips
`Utils.deep_symbolize_keys` and deep-merges the loaded Hash as it is. `deep_symbolize_keys`
(`i18n/utils.rb:34-38`) keeps a key that has no `to_sym` (an Integer) as it is.

trails' `packages/i18n/src/backend/base.ts#loadYml` drops `symbolize_names`
(`@missingRailsArgs unsafe_load_file — PERMANENT`) and, since trails#8950 made Psych revive untagged
mappings into a ruby-compat `Hash`, returns `keys_symbolized = false` (the `YAML.load_file` arm,
`base.rb:266`). It does that because the translations store (`TranslationData`, `utils.ts`) is a
bare-keyed plain object. A `":foo"`-keyed Hash would miss every lookup, and
`deepSymbolizeKeys` stringifies an Integer key, so `1` and `"1"` collapse into one key.

## Acceptance criteria

- [ ] `loadYml` passes `symbolizeNames: true` and returns `true`, as `base.rb:264` does. The
      `@missingRailsArgs` receipt is removed.
- [ ] The translations store and `deepSymbolizeKeys` / `deepMergeBang` keep the loaded Hash's key
      types: Integer keys stay Integers and `":sym"` keys resolve in lookup.
- [ ] `simple.test.ts` "simple load_yml: loads data from a YAML file" asserts the symbolized Hash.
