---
title: "tooling: the TS option-key collector reads the last param and follows copies; the Ruby one does neither"
status: in-progress
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: ["actionpack", "actionview"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8427
claim: "2026-10-02T23:32:01Z"
assignee: "call-args-string-descriptors-compare-undecoded-ruby-source"
blocked-by: null
closed-reason: null
---

## Context

After trails#8420 the option-key axis measures the keys a TS body reads (`extractOptionReads`,
`scripts/api-compare/extract-ts-api.ts`) against the keys the Ruby body reads (`collect_option_keys`,
`scripts/api-compare/extract-ruby-api.rb`). Two asymmetries between the two collectors still produce
rows that are not port findings:

- **Which param is the options hash.** Ruby picks it by name (`option_var_names`: `options` / `opts` /
  a named `**kwargs`). The TS side (`extractOptionKeys` and `extractOptionReads`) takes the LAST
  parameter. `will_cache?(options, view)`
  (`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/partial_renderer/collection_caching.rb:16-18`)
  is ported as `isWillCache(options, view)`
  (`packages/actionview/src/renderer/partial-renderer/collection-caching.ts:37`), so the TS side reads
  `view`: the report shows `missingInTs: ["cached"]`, `extraInTs: ["controller"]`, and both are wrong.
- **Copies.** The TS collector follows a copy (`const routeOptions = { ...options }`); the Ruby one does
  not follow `route_options = options.dup`. `map_match`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1992-1996`) reads
  `route_options[:action]`, the port reads `routeOptions.action`
  (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, `mapMatch`), and the report shows
  `extraInTs: ["action"]`.

## Acceptance criteria

- [ ] The TS side selects the options param the way `option_var_names` does (a param named `options` / `opts`, else the trailing object param it uses today), in both `extractOptionKeys` and `extractOptionReads`, with a unit test over a non-trailing `options` param.
- [ ] The Ruby collector follows a local assigned from the options var through `dup` / `merge` / `except` / `slice` / a bare copy, or the TS collector stops following copies. Pick the direction that leaves both sides reading the same shapes, with a test for `route_options = options.dup`.
- [ ] `will_cache?` and `map_match` leave `options-key-mismatches.json`; before/after counts per package are in the PR body.

## Verification

```bash
pnpm vitest run scripts/api-compare scripts/parity
```
