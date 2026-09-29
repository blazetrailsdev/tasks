---
title: "Port Rack::Cache::Key"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["enroll-rack-cache-in-compare-tooling"]
deps-rfc: []
est-loc: 150
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-cache/v1.17.0/lib/rack/cache/key.rb` (68 lines). `Key` (`:4`)
`include`s `Rack::Utils` (`:5`) for `escape` / `unescape`
(`packages/rack/src/utils.ts:85,99`). `MetaStore#cache_key`
(`meta_store.rb:112-115`) uses it as the default key generator, so it has to
land before `port-rack-cache-meta-store-base-and-heap`.

- `class << self; attr_accessor :query_string_ignore; end` (`:18-20`) is a
  class-level accessor. `query_string` passes it to `reject!` as a block
  (`:63`), so an unset `nil` means "reject nothing". Port that arm. Do not
  default it to a function.
- `self.call(request)` → `new(request).generate` (`:24-26`) lets a proc stand in
  for the class wherever a key generator is expected (`meta_store.rb:113`,
  `request.env['rack-cache.cache_key'] || Key`).
- `generate` (`:33-52`): scheme, host, a port only when it is non-default for the
  scheme, `script_name`, `path_info`, and the normalized query.
- private `query_string` (`:57-66`): split on `/[&;] */n`, unescape each
  `k=v`, **sort**, reject through `query_string_ignore`, re-escape, and join with
  `&`. It returns `nil` when empty. `parts.sort!` sorts two-element arrays
  lexicographically, which is not what JS's default `Array#sort` does. Port it
  with the ruby-compat comparison, not a bare `.sort()`.

Tests: `test/key_test.rb` (85 lines, 11 cases) → `packages/rack-cache/src/key.test.ts`.

## Acceptance criteria

- [ ] `src/key.ts` ports `Key` at its Ruby names, including the class-level
      `queryStringIgnore` accessor and the static `call`.
- [ ] `key.test.ts` ports all 11 cases with Rails-identical names.
- [ ] `pnpm parity:api` reports `key.rb` complete, and the call gates add no row.
