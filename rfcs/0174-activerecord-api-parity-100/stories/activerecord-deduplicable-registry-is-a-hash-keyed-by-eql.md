---
title: "activerecord: Deduplicable.registry is Rails' Hash keyed by eql?"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ConnectionAdapters::Deduplicable::ClassMethods#registry` is `@registry ||= {}`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:9-11`), and
`#deduplicate` is the one line `self.class.registry[self] ||= deduplicated` (`:18-20`): a plain Hash
keyed by the value object through `hash` / `eql?`.

trails' `packages/activerecord/src/connection-adapters/deduplicable.ts` instead keeps a
`WeakMap<class, Map<hash, WeakRef[]>>` with a `FinalizationRegistry`, and `deduplicate` walks the
bucket with `rbEqual`. That is invented storage and an invented body; trails#8368 moved the bodies
into the module but left this shape alone.

Converging it onto ruby-compat's `Hash` (which keys on `rbHash` / `rbEql`) needs `eql?`, which Rails
declares as `alias eql? ==` and trails does not port on any of these classes — `parity:api --missing`
lists `eql? → isEql` for `connection_adapters/column.rb:88`, `sql_type_metadata.rb:27`,
`mysql/type_metadata.rb:23`, `postgresql/type_metadata.rb:25`, `postgresql/column.rb`,
`sqlite3/column.rb` and `postgresql/utils.rb`. `rbEql` falls back to identity for an object with no
`eql` (`packages/ruby-compat/src/rb-equal.ts:96-108`), so a `Hash` registry would never find an
equal column until those land.

## Acceptance criteria

- [ ] `eql?` is ported beside `==` on the column and type-metadata classes above, at the spelling `docs/ruby-ts-conventions.md` produces.
- [ ] `registry` is `@registry ||= {}` as a per-class ruby-compat `Hash`, and `deduplicate` is `registry[self] ||= deduplicated`; the `WeakRef` buckets and the `FinalizationRegistry` are deleted.
- [ ] `column-equality.trails.test.ts` and `column.trails.test.ts` stay green.
- [ ] `pnpm parity:api` no longer lists an `eql?` miss for those files.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
