---
title: "SchemaMigration/InternalMetadata count coerce with Number(...) where Rails answers select_values(...).first"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6262
claim: "2026-08-08T20:45:03Z"
assignee: "date-start-argument-and-reform-surface-absent"
blocked-by: null
closed-reason: null
---

## Context

Left open by PR #6249, which converged the rest of these two bodies onto
Rails' typed statement calls.

Rails answers the raw value the driver returned:

```ruby
# schema_migration.rb:91-98 and internal_metadata.rb:64-71
connection.select_values(sm, "#{self.class} Count").first
```

trails coerces:

```ts
const values = await this._withConnection((connection) =>
  connection.selectValues(sm, `${this.constructor.name} Count`),
);
return Number(values[0] ?? 0);
```

(`packages/activerecord/src/schema-migration.ts` `count`,
`packages/activerecord/src/internal-metadata.ts` `count`.)

Two divergences remain:

1. **The coercion.** `Number(...)` and the `?? 0` fallback are trails
   inventions. Rails hands back whatever `select_values` yielded — on an
   adapter that returns the count as a String, Rails' callers see a String.
   The `?? 0` also turns an empty result set (which cannot happen for
   `COUNT(*)`, but is the shape the code claims to handle) into `0` where
   Rails would answer `nil`.
2. **`.first`.** A JS array has no `first`, so the `count` / `first`
   call-mismatch baseline row survives in both
   `scripts/api-compare/call-mismatches-exclude/activerecord/schema-migration.json`
   and `.../internal-metadata.json`. Whether that is convergeable at all
   depends on whether trails wants an array `first` analogue; if not, the two
   rows are the honest record of a language shortcoming and this story should
   say so at the call site rather than in the baseline reason.

## Converged shape

`count(): Promise<number>` is the trails return type both callers depend on, so
the coercion cannot simply be deleted — establish whether the driver ever
answers a non-number here (sqlite3 / mysql2 / pg all return an integer for
`COUNT(*)`), and if it does not, the coercion is dead code to remove rather
than a deviation to keep.

## Acceptance criteria

- [ ] The `Number(...)` coercion and `?? 0` fallback are either removed as dead
      code or justified at the call site with the adapter that needs them.
- [ ] The `count` / `first` baseline row in both files is deleted, or carries a
      reviewed one-line reason naming the language shortcoming.
