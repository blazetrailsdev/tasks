---
title: "native-hash-key-sites-uncredited-receiver-names"
status: ready
updated: 2026-10-12
rfc: "0190-native-js-hash-forms"
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

The three `native-hash-key-sites-*` stories moved every `hasKey(h, k)` on a plain object onto `k in h` / `Object.hasOwn(h, k)`. Thirteen sites went back on the helper because `parity:api:calls` does not credit the native form there, and the stories forbid a baseline row. The receiver is a plain object at each one; what misses is the receiver-name match in `hasNativeFormAnalogue` (`scripts/api-compare/compare.ts:855-878`) against `receiverTailName` (`scripts/api-compare/extract-ts-api.ts:6981-6995`).

Underscore-prefixed field (`this._x` has tail `_x`, Ruby names `x`):

- `packages/actionpack/src/action-dispatch/journey/path/pattern.ts:77`, `@matchers.key?(node)` (`actionpack/lib/action_dispatch/journey/path/pattern.rb:87`)
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:208`, `@config.key?(:strict)` (`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:127`)
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:524`, `@config.key?(:insert_returning)` (`postgresql_adapter.rb` `initialize`)
- `packages/activerecord/src/fixture-set/table-row.ts:138`, `@row.key?(c_name)` (`activerecord/lib/active_record/fixture_set/table_row.rb` `fill_timestamps`)

Constant receiver (`snakeToCamel` mangles `STATUS_WITH_NO_ENTITY_BODY`):

- `packages/rack/src/content-length.ts:17` (`rack/lib/rack/content_length.rb:22`), `packages/rack/src/content-type.ts:17`, `packages/rack/src/deflater.ts:95` (`rack/lib/rack/deflater.rb:139`, `Utils::STATUS_WITH_NO_ENTITY_BODY`)

Class variable receiver:

- `packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:312`, `@@rescue_responses.key?(exception.class.name)` (`actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:195`)

Receiver is a call the tail name does not reach:

- `packages/activerecord/src/core.ts:1008`, `columns_hash.key?(key)` written `columnsHash.call(this)` (tail `call`)
- `packages/activerecord/src/relation/query-methods.ts:1735`, `klass.columns_hash.key?(field)` written `modelClass?.columnsHash?.() ?? {}`

`include?` on an ivar, which credits only for a proven `hash` kind:

- `packages/activerecord/src/fixture-set/table-row.ts:123`, `:172`, `:177`, `@row.include?(...)`

## Acceptance criteria

- [ ] Each site above is on the native form, by renaming the TS receiver to the Rails name where that is the mismatch, or by a gate change that credits the receiver shape; no baseline row and no `@missingRailsCall` receipt.
- [ ] A gate change carries a test in `scripts/api-compare/` for the shape it admits, and still flags the form on a different receiver.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] A site that cannot be credited is listed in the PR body with the reason.
