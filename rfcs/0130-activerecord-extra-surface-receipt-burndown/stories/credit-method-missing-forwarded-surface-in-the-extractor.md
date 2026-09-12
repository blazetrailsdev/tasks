---
title: "credit-method-missing-forwarded-surface-in-the-extractor"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migration`'s 45 schema statements (`addColumn` … `views`) score as `moved` extra surface on
`packages/activerecord/src/migration.ts` and carry
`@noRailsEquivalent CONVERGEABLE` receipts, because `migration.rb` declares none of them:
Ruby reaches them through `Migration#method_missing`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1044-1057`), which wraps the call in
`say_with_time`, rewrites the table-name arguments, and sends to `execution_strategy` —
`DefaultStrategy#method_missing` then forwards to the connection
(`vendor/rails/activerecord/lib/active_record/migration/default_strategy.rb:8-10`), where
`abstract/schema_statements.rb` declares every one of them.

**So Rails DOES respond to `add_column` on a `Migration`.** The extractor cannot see it,
because the response is dynamic — exactly the blind spot RFC 0130 route 3 ("credit it in the
extractor, where the name is Rails surface the Ruby extractor cannot see") exists for, and the
same route that credited `encryption/configurable.rb`'s `delegate` loop and
`encryption/cipher.rb`'s reopened class in trails#7729.

trails#7729 converged everything about these methods that could be converged without touching
the extractor: every body now routes through `Migration#methodMissing` (the faithful port of
`method_missing`), forwarding the caller's exact argument list, so `say_with_time`, the
`proper_table_name` rewriting and the strategy dispatch all happen where Rails has them. What
it could NOT do is retire the receipts.

### Why the existing story cannot retire them

`migration-delegators-belong-on-current-not-migration` (RFC 0023) proposes moving the block
onto `Migration::Current`. That cannot lower the count: **`class Current < Migration` is
declared in `migration.rb` itself, at line 579**, so `Current`'s members map onto the same TS
file and score identically. Its "`parity:api:extra:tighten` writes `total` DOWN" criterion is
unreachable for these 45 names.

Nor can the declarations simply be deleted. JS has no `method_missing`; a `Proxy`'s `get` is
invisible to the type system, so a subclassable `Migration` either declares each statement or
every schema call in user migrations becomes `any`.

## Converged shape

Teach the Ruby extractor that a `method_missing` that forwards to another entity confers that
entity's surface, so the 45 names are scored **matched** rather than `moved`, and the receipts
are deleted rather than reworded.

Concretely, in `scripts/api-compare/extract-ruby-api.rb`:

- Record a `forwardsTo` fact when a `def method_missing` body's send target is a reader on the
  same class (`execution_strategy`, `:1055`) — the same way `each_loop_delegate` records a
  `delegate` (`:2060`).
- Resolve the chain one hop further through `DefaultStrategy#method_missing` →
  `connection.send` → the adapter, and union the adapter's public schema-statement names into
  `ActiveRecord::Migration`'s allowed set for extra-surface scoring only (NOT into
  `parity:api`'s expected-method population, which would invent ~45 phantom misses on every
  other file that reaches an adapter).
- The union must be narrow: only names the resolved target actually declares. A blanket
  "`method_missing` allows anything" rule would silence real invented surface on every class
  that has one.

Then delete the 45 `@noRailsEquivalent CONVERGEABLE` receipts from `migration.ts` and run
`pnpm parity:api:extra:tighten`.

## Acceptance criteria

- [ ] The Ruby extractor credits `method_missing`-forwarded surface, narrowly, for `ActiveRecord::Migration`.
- [ ] The 45 `@noRailsEquivalent CONVERGEABLE` receipts in `packages/activerecord/src/migration.ts` are deleted, not reworded.
- [ ] `pnpm parity:api:extra --package activerecord` reports 0 extras for `migration.ts`.
- [ ] `pnpm parity:api` shows a non-negative delta — no phantom missing methods are introduced on any file.
- [ ] `pnpm parity:api:extra:tighten` writes activerecord's `total` mark DOWN by the number credited.
- [ ] `scripts/api-compare/extract-ruby-api.test.ts` gains a fixture pinning both halves: a forwarding `method_missing` credits the target's names, and a class with a `method_missing` that forwards nowhere credits nothing.
