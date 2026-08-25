---
title: "ToJsonWithActiveSupportEncoder#toJSON returns unknown where Ruby's to_json returns a String"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6214
claim: "2026-08-08T01:26:09Z"
assignee: "connection-pool-disconnect-returns-before-the-driver-drains"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ToJsonWithActiveSupportEncoder#to_json`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:35-43`)
returns a String on **both** arms: `super(options)` is the JSON gem's
`to_json`, and `ActiveSupport::JSON.encode(self, options)` is a String too.

The trails port (`packages/activesupport/src/core-ext/object/json.ts:39-52`)
declares `toJSON(...): unknown`, because it overloads the Ruby method with the
JS `JSON.stringify` protocol: `JSON.stringify` calls `toJSON(key)` with the
property key, and that arm returns `this.asJson()` — an object, not a String.
The string-vs-`::JSON::State` discriminator is real and load-bearing, but the
`unknown` return leaks to every caller.

PR #6212 (`converge-activemodel-tojson-onto-the-ported-tojson`) surfaced the
cost: retiring ActiveModel's invented `toJson` spelling in favour of this
mixin forced `as string` at every `JSON.parse` boundary it swept —
`packages/activemodel/src/dirty.test.ts`,
`packages/activemodel/src/serialization.test.ts`,
`packages/activemodel/src/serializers/json-serialization.test.ts`,
`packages/activemodel/src/serializers/json.test.ts` — and
`packages/activerecord/dx-tests/basic-crud.test-d.ts:205` had to weaken
`expectTypeOf(...).toBeString()` to `.toBeUnknown()`. A Rails dev reading
`to_json` expects a String; our signature says it might be anything.

## Converged shape

Give the two arms distinct return types so callers of the Ruby method get
`string`. A TS overload signature is the obvious candidate — the
`options?: EncodeOptions | null` arm declared `: string` and the
`options: string` (stringify-protocol) arm declared `: unknown` — since the
discriminator is already the argument type. Then drop the `as string` casts at
the swept call sites and restore `toBeString()` in the dx-test.

Check the other `include(..., ToJsonWithActiveSupportEncoder)` hosts for the
same relief: `packages/activemodel/src/model.ts:2628`,
`packages/activemodel/src/naming.ts:424`,
`packages/actionpack/src/action-dispatch/journey/gtg/transition-table.ts:299`.

Also fold in the stale prose at
`packages/activesupport/src/json/encoding.ts:65`, which still names `toJson`
— a spelling that no longer exists anywhere in the repo.

## Acceptance criteria

- [ ] `toJSON()` called the Ruby way (no argument, or an options hash) is typed
      `string`, not `unknown`.
- [ ] The `as string` casts PR #6212 added at the activemodel JSON-test call
      sites are gone.
- [ ] `packages/activerecord/dx-tests/basic-crud.test-d.ts` asserts
      `toBeString()` again.
- [ ] `packages/activesupport/src/json/encoding.ts:65` no longer names the
      retired `toJson` spelling.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative; no test
      renamed.
