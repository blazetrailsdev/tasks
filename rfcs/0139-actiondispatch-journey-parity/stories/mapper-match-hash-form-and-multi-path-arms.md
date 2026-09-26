---
title: "mapper-match-hash-form-and-multi-path-arms"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mapper::Resources#match(path, *rest, &block)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1689-1720`)
has two argument arms. The `Hash === path` arm handles `match "path" => "c#a", via: :get`.
It finds the one String key (`options.find { |name, _value| name.is_a?(String) }`), raises
`ArgumentError, "Route path not specified"` when there is none, and maps a Symbol `to` onto
`:action` and a `#`-less String `to` onto `:controller`. The other arm is
`options = rest.pop || {}; paths = [path] + rest`.

trails' `Mapper#match` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`,
`match(path, options)`) now ends in `mapMatch` / `defaults` as Rails does
(mapper-match-delegates-to-map-match). It ports neither the hash-form arm nor the
multi-path `*rest` arm:

- The hash-form arm needs a String-vs-Symbol key discriminator. A JS object has one key
  type, and trails' option keys are bare camelCase, so `{ "/foo": "c#a", via: "get" }`
  cannot tell the path key from an option key. A settled spelling is needed: a
  `":"`-prefixed Symbol key, or a Map argument.
- `*rest` is only reached by the multi-path form, which `map_match` deprecates
  (`mapper.rb:1962-1966`). The param-name gate compares `match` against the
  `Base#match(path, options = nil)` doc stub (`mapper.rb:592`), because the comparer
  collapses same-name definitions onto the first one. So a `...rest` signature reds
  `parity:api:params` even though it is the Rails shape.

## Acceptance criteria

- `match` accepts Rails' hash form with a documented key discriminator, including the
  `Route path not specified` raise and the Symbol/String `to` arms.
- The multi-path arm and `map_match`'s deprecation warning are ported, or the comparer
  resolves `match` to `Resources#match` so the `*rest` spelling scores.
