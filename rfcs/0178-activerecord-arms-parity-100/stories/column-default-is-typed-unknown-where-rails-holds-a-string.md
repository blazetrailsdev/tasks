---
title: "activerecord: Column#default is typed unknown where Rails holds a String or nil"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8721
claim: "2026-10-09T18:39:41Z"
assignee: "attribute-methods-class-attribute-names-memo-and-cold-cache-arms"
blocked-by: null
closed-reason: null
---

## Context

`Column#default` is documented as a String or `nil`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/column.rb:17`), and
`Column#deduplicated` calls `-default` on it (`column.rb:107`), which raises `NoMethodError` for
anything that is not a String.

In trails the field and the constructor parameter are typed `unknown`
(`packages/activerecord/src/connection-adapters/column.ts`), so `deduplicated` casts
(`strUminus(this.default as string)`) and a non-String default passes through where Ruby raises.
Narrowing the type to `string | null` was tried in trails#8717 and breaks six sites:
`postgresql/column.ts:34`, `sqlite3/column.ts:37`, `support/fake-adapter.ts:41`,
`abstract-mysql-adapter.trails.test.ts:420`, `schema-cache.test.ts:44` and `column.ts`'s own
`initWith` assignment.

The value is not always a JS string either. SQLite's `extract_value_from_default` returns
`[$1].pack("H*")` for a hex blob default, a binary String in Ruby, and the port returns a `Buffer`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, `extractValueFromDefault`).
Both adapters' `extractValueFromDefault` are typed `unknown`, so the narrowing also reaches
`postgresql/schema-statements.ts`, `sqlite3/schema-statements.ts`, `sqlite3/column.trails.test.ts`
and `support/fake-adapter.trails.test.ts`. Read `string | null` below as `string | Uint8Array | null`.

## Acceptance criteria

- [ ] `Column#default` and the constructor's `default` parameter are `string | null`, in
      `Column` and its PostgreSQL and SQLite3 subclasses.
- [ ] Each caller passes a String or `null`; `fake-adapter.ts` and the two tests are fixed at the
      call site, not by widening the type back.
- [ ] `Column#deduplicated` calls `strUminus(this.default)` with no cast.
