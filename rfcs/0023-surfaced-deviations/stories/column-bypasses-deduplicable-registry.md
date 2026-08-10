---
title: "Column bypasses the Deduplicable registry and has no deduplicateKey"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ConnectionAdapters::Column` does `include Deduplicable`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/column.rb:8`),
so `Column.new` is wrapped by `Deduplicable::ClassMethods#new`
(`deduplicable.rb:13`) and every construction goes through
`registry[self] ||= deduplicated` (`deduplicable.rb:18`). Identical columns
therefore collapse to one frozen instance. The registry key is the column
itself, which is why Rails pairs `==`/`eql?` with `hash` (`column.rb:75`/`:87`) —
those three are what make the `Hash` lookup work.

trails' `Column` (`packages/activerecord/src/connection-adapters/column.ts`)
overrides the mixin instead:

```ts
deduplicate(): this {
  return this.deduplicated();
}
```

It never touches the Deduplicable registry, and it does not implement
`deduplicateKey()` — the key the trails port of `deduplicate`
(`connection-adapters/deduplicable.ts:31`) needs to build its Map key. So
`Column` silently opts out of dedup entirely: every reflected column is a
distinct object where Rails shares one.

This is the same bypass as
[[adapter-type-metadata-bypasses-deduplicable-registry]] (MySQL/PostgreSQL
`TypeMetadata`), but in a third class that story does not scope. `SqlTypeMetadata`
is the one member of the cluster that does implement `deduplicateKey`
(`sql-type-metadata.ts`) and goes through the shared path.

PR #5630 ported `Column#==` as `equals`, which supplies the value-equality half
of what the registry key needs; `deduplicateKey` is the remaining piece.

Note that Rails' `Column#deduplicated` also interns the string attributes
(`column.rb:104-112`: `-name`, `-default`, `-default_function`, `-collation`,
`-comment`) and calls `super` to `freeze`. trails' `deduplicated` only forwards
`deduplicate` to `sqlTypeMetadata` and never freezes.

## Acceptance criteria

- [ ] `Column` implements `deduplicateKey()` over the attributes `==`/`hash`
      compare (`column.rb:75`/`:87`), and drops the `deduplicate()` override so
      construction goes through the shared registry path in
      `connection-adapters/deduplicable.ts`.
- [ ] The PostgreSQL and SQLite3 subclasses extend the key with the attributes
      their own `hash` folds in (`postgresql/column.rb:72`, `sqlite3/column.rb:53`
      — note the SQLite one includes `rowid`, which its `==` does not).
- [ ] `deduplicated` freezes, matching `Deduplicable#deduplicated`
      (`deduplicable.rb:26`), or the omission is justified at the call site if
      freezing breaks existing callers.
- [ ] A test asserts two identically-constructed columns are the same instance,
      failing on baseline.
- [ ] `parity:api` / `parity:api:extra` deltas stay non-negative.
