---
title: "Route the eager limited-ids subquery's limit/offset through build_arel's sanitizers"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: 6733
claim: "2026-08-19T00:11:25Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `widen-limit-offset-value-read-declarations` (PR #6686),
which widened `limitValue` / `offsetValue` to `number | string | null` because
`limit!` / `offset!` are bare assignments in Rails
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1215-1218`,
`:1231-1234`) and the value stays raw until `build_arel` sanitizes it.

Rails' `build_arel` is the ONLY place the raw value is made safe
(`query_methods.rb:1757-1758`):

```ruby
arel.take(build_cast_value("LIMIT", connection.sanitize_limit(limit_value))) if limit_value
arel.skip(build_cast_value("OFFSET", offset_value.to_i)) if offset_value
```

trails mirrors that faithfully in `relation/query-methods.ts:3194-3195`
(`sanitizeLimit(this.limitValue)` / `toI(this.offsetValue)`).

But `Relation`'s eager limited-ids subquery builder
(`packages/activerecord/src/relation.ts:2162-2163`) hands the values to Arel
RAW:

```ts
if (this.limitValue !== null) idSubquery.take(this.limitValue);
if (this.offsetValue !== null) idSubquery.skip(this.offsetValue);
```

It is a second, parallel arel-building path that skips the sanitizer. Before
PR #6686 the declared type hid this (it read `number | null`); now the declaration
is honest and the site is visibly unguarded, so `Post.limit("asdfadf")` with an
eager load can push a bare string into `Arel::Nodes::Limit` instead of raising
`invalid value for Integer` the way the main `build_arel` path does.

## Converged shape

Route both reads through the same sanitizers `build_arel` uses, so the two
arel-building paths agree:

```ts
if (this.limitValue !== null) idSubquery.take(sanitizeLimit(this.limitValue));
if (this.offsetValue !== null) idSubquery.skip(toI(this.offsetValue));
```

`sanitizeLimit` is already imported in `relation.ts:75`; `toI` is currently
module-private in `relation/query-methods.ts:2277` and needs exporting (or the
subquery builder folded onto the real `buildArel` limit/offset step, which is
the better end state if it is reachable).

## Acceptance criteria

- [ ] The limited-ids subquery applies `connection.sanitize_limit` /
      `offset_value.to_i`, matching `query_methods.rb:1757-1758`.
- [ ] A non-numeric `limit(...)` on an eager-loaded relation raises the same
      error, at the same point, as it does on the plain `build_arel` path.
- [ ] Regression test fails on baseline. Green on SQLite, PostgreSQL and
      MySQL/MariaDB.
