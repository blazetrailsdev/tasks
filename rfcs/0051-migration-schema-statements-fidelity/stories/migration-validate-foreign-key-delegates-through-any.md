---
title: "Migration#validateForeignKey delegates through an any-cast, hiding signature drift"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5770
claim: "2026-07-31T23:20:40Z"
assignee: "migration-validate-foreign-key-delegates-through-any"
blocked-by: null
closed-reason: null
---

## Context

`Migration#validateForeignKey` (`packages/activerecord/src/migration.ts:776-784`)
launders its delegation through `as any`:

```ts
await (this.connection as any).validateForeignKey(this._pt(fromTable), toTable, opts);
```

The cast defeats every check on the call. #5501 widened both this wrapper's
declared options and `PostgreSQLAdapter#validateForeignKey`
(`connection-adapters/postgresql-adapter.ts:3940`) from `{ name?: string }` to
`Omit<ForeignKeyLookupOptions, "toTable">`, because the narrow shape rejected
Rails' `validate_foreign_key :astronauts, column: "rocket_id"`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:472-478`)
even though it worked at runtime. That defect survived undetected precisely
because this `as any` meant no call site ever typechecked against the real
signature — the mismatch only surfaced when a test bypassed the wrapper and
called the adapter directly.

The delegation is real: `validate_foreign_key` is PostgreSQL-only
(`supports_validate_constraints?`, `postgresql_adapter.rb:232`), so
`this.connection` typed as the abstract adapter genuinely lacks the method. That
is an argument for a narrowing helper or an optional-method interface, not for
`as any`. Note `0037-no-explicit-any-enforcement` is closed, so this is not
covered by that campaign.

Rails' own shape: `Migration` forwards to the connection via `method_missing`
(`vendor/rails/activerecord/lib/active_record/migration.rb:960-976`), which is
untyped in Ruby by nature — so there is no fidelity reason to keep the cast, and
no Rails counterpart that the cast is modelling.

Worth checking whether sibling delegations in `migration.ts` use the same
`as any` escape for other adapter-specific schema statements
(`validateCheckConstraint`, `validateConstraint`); if so, converge them together.

## Acceptance criteria

- [ ] `migration.ts:783` no longer uses `as any`; the delegation resolves
      against a real type (a PG-adapter downcast, or an interface declaring the
      adapter-specific schema statements as optional methods).
- [ ] The options type on the call site is checked against
      `Omit<ForeignKeyLookupOptions, "toTable">` — i.e. reintroducing the old
      narrow `{ name?: string }` on the adapter would now fail typecheck.
- [ ] Audit the other adapter-specific delegations in `migration.ts` for the
      same pattern and converge any found, or note why they differ.
- [ ] `pnpm typecheck` clean; `migration.test.ts`,
      `migration/foreign-key.test.ts` and
      `adapters/postgresql/invertible-migration.test.ts` green on all three
      adapters.
