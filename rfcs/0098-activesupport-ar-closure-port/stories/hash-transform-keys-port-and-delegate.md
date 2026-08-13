---
title: "Port Hash#transform_keys and delegate the four key casts to it"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6473
claim: "2026-08-13T16:05:43Z"
assignee: "route-update-record-through-update-row"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting the `core_ext/hash/keys.rb` bang forms in PR #6455.

Rails writes every key cast in `core_ext/hash/keys.rb` on top of Ruby's
`Hash#transform_keys` / `#transform_keys!`:

- `stringify_keys` → `transform_keys { |k| Symbol === k ? k.name : k.to_s }`
  (`vendor/rails/activesupport/lib/active_support/core_ext/hash/keys.rb:10-12`)
- `stringify_keys!` → `transform_keys!` (keys.rb:15-17)
- `symbolize_keys` → `transform_keys { |key| key.to_sym rescue key }` (keys.rb:27-29)
- `symbolize_keys!` → `transform_keys!` (keys.rb:33-35)

trails has no ported `transformKeys` for plain objects, so
`packages/activesupport/src/hash-utils.ts` inlines an `Object.keys` loop in
`stringifyKeys` and delegates `symbolizeKeys` to it. Two baseline rows already
record this and name this work as the fix:

````text
scripts/api-compare/call-mismatches-exclude/activesupport/hash-utils.json
  stringify_keys → transform_keys   ("Converging needs a ported `transformKeys`
                                      for plain objects to delegate to — filed
                                      as its own work")
  symbolize_keys → transform_keys
```text

PR #6455 added a PRIVATE `transformKeysBang` helper in that file as the
in-place primitive its bang forms are written on. That is half the shape: the
public `transformKeys` and the delegation from the four casts are still missing.

## Converged shape

Port `Hash#transform_keys` and `Hash#transform_keys!` as public members of
`hash-utils.ts` (promoting the existing private `transformKeysBang`), then
rewrite all four casts to delegate to them exactly as keys.rb does. Deleting
the two baseline rows above is the acceptance signal.

Note `deep_transform_keys` / `deep_transform_keys!` already delegate correctly
through `_deepTransformKeysInObject(!)`; only the shallow casts are affected.

## Acceptance criteria

- [ ] `transformKeys` / `transformKeysBang` are public and Rails-shaped.
- [ ] `stringifyKeys(!)` / `symbolizeKeys(!)` delegate rather than inlining a loop.
- [ ] The two `transform_keys` rows are DELETED from
      `call-mismatches-exclude/activesupport/hash-utils.json` (only-shrink).
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline row.
````
