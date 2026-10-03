---
title: "parity: invoking a lambda-valued member is Proc#call, not an omitted call"
status: done
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: ["activerecord", "actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8435
claim: "2026-10-03T02:25:21Z"
assignee: "call-gate-credits-a-ruby-compat-import-renamed-around-a-module-homonym"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit (trails#8328): the receipt
below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this
story.

`Builder::HasAndBelongsToMany#through_model` resolves the join table lazily through a lambda
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:24-28,51`):

```ruby
def self.table_name
  @table_name ||= table_name_resolver.call
end
…
join_model.table_name_resolver = -> { table_name }
```

`Proc#call` is how Ruby invokes a lambda. A JS function is invoked with `()`, so
`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts` writes
`this.tableNameResolver()` — the same invocation, with no member named `call` — and the call-set gate
charges the body with an omitted `call`, which is `@missingRailsCall call`.

Writing `this.tableNameResolver.call(null)` instead was tried in trails#8328 and rejected in review:
it is `Function.prototype.call`, not `Proc#call`, it exists only so the gate sees the name, and it
changes the resolver's `this`.

The same receipt is `PERMANENT` on `connection-handling.ts`, `migration.ts` (×4), `statement-cache.ts`,
`database-configurations.ts`, `database-configurations/database-config.ts` and
`type/hash-lookup-type-map.ts`, and in actionpack on `journey/visitors.ts`, `middleware/cookies.ts` (×2)
and `routing/mapper.ts`.

`NO_JS_CALL_FORM` (`scripts/api-compare/compare.ts`) is keyed by bare name and cannot take `call`:
`call` is also a real ported method (`Preloader#call`, a Rack app's `call`, `PredicateBuilder` handlers).
The row-scoped mechanism beside it (`significantCallsForReceivers`, RFC 0129) can: drop `call` from
significance for ONE Ruby body when the TS body invokes, as a function, the member the Ruby body sends
`call` to.

## Acceptance criteria

- [ ] The call-set comparator credits Ruby `x.call(...)` when the paired TS body invokes `x(...)` — the same member or local, by its convention name — with unit tests for the credited case and for a body that drops the invocation (still flagged) and one whose `call` is a ported method on another receiver (still flagged).
- [ ] `has-and-belongs-to-many.ts`'s `@missingRailsCall call` is deleted, with every other `@missingRailsCall call` receipt the rule covers; one the rule does not cover keeps its tag and is listed in the PR body.
- [ ] `pnpm parity:api:calls` and `:receipts:gate` green with no new baseline row.

## Verification

```bash
pnpm vitest run scripts/api-compare/compare.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:receipts:gate
```
