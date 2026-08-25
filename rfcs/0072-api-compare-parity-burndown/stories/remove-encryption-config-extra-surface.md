---
title: "Remove encryption/config.ts's five novel names (excludeFromFilterParameters, defaultCompressor, keyProviderClass)"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6087
claim: "2026-08-04T20:20:03Z"
assignee: "i18n-date-parse-answers-a-hash-never-null"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports five novel names in
`packages/activerecord/src/encryption/config.ts` — public surface with no
counterpart in `vendor/rails/activerecord/lib/active_record/encryption/config.rb`:

```text
encryption/config.ts — 5 novel, 0 moved
  defaultCompressor  deflate  excludeFromFilterParameters  inflate  keyProviderClass
```

Against Rails (`config.rb:9-12`, the `attr_accessor` list):

- `excluded_from_filter_parameters` is the Rails name. trails stores the value in a
  second field, `excludeFromFilterParameters`, and exposes `excludedFromFilterParameters`
  as a getter over it — so the Rails-named member is read-only and the writable one
  is invented. Callers write the invented spelling.
- `compressor` is a Rails accessor defaulting to `Zlib` (`config.rb:59`); trails adds
  a `Compressor` interface plus an exported `defaultCompressor` object with
  `deflate`/`inflate` members, all three of which score as novel.
- `key_provider_class` does not exist in `config.rb` at all — Rails resolves the key
  provider through `Config#key_provider` / the scheme, not a class-name string.

PR #6082 left these untouched (it converged the credential readers/predicates only);
they are the file's whole remaining extra-surface count.

## Converged shape

- Single field named for Rails: `excludedFromFilterParameters`, writable, with the
  `excludeFromFilterParameters` spelling and its getter deleted and callers updated.
- Fold `defaultCompressor` into the `compressor` accessor's default so the module
  exports no extra name; keep `Compressor` only if the type is genuinely needed
  (a type-only `interface` name is exempt by kind, the value export is not).
- Trace `keyProviderClass`' callers and remove it, or tag it with the reason it
  cannot follow Rails' key-provider resolution.

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package activerecord` reports 0 novel names for
      `encryption/config.ts` (or each survivor carries a reviewed
      `@noRailsEquivalent <reason>`).
- [ ] `pnpm parity:api` keeps `encryption/config.rb` at 100%.
- [ ] Encryption suites green on all three lanes.
