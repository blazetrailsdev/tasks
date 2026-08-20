---
title: "Collapse trails' two assign_attributes ports onto the single ActiveModel one"
status: ready
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has exactly one `assign_attributes`
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:28-34`);
ActiveRecord does not redefine it. trails has **two** ports:

- `packages/activemodel/src/attribute-assignment.ts` — `assignAttributes`, sync
- `packages/activerecord/src/persistence.ts` — `assignAttributes`, returning
  `Promise<void> | void`

The AR copy exists because the AR write path can owe I/O (nested-attribute
writers, `set#{Name}Attributes`), and a TS `set` accessor cannot be awaited. That
split then forces the Ruby guard at `attribute_assignment.rb:29-32` to be written
twice, and with it two file-private helpers duplicated verbatim across the
package boundary:

- `respondToEachPair` — the JS spelling of `respond_to?(:each_pair)`
- `classOf` — the JS spelling of `#{new_attributes.class}` for the
  `ArgumentError` message

PR #6780 converged the ActiveModel side onto Rails' three lines and deliberately
kept the AR copy private rather than exporting the pair: exporting would put two
names with no Ruby counterpart back onto a file `parity:api:extra` had just
cleared to 0 novel, plus transit rows through `index.ts`. That trade is right
while two ports exist — but two ports is the actual deviation, and it is the one
worth retiring.

Related, already tracked: `assign-attributes-hwia-each-pair` (HWIA fails both
guards) and `assign-attribute-respond-to-setter-reraise-arm`.

## Converged shape

One `assign_attributes`, at ActiveModel's Rails home, with the async return type
the AR path needs — the settled trails idiom for a body that owes I/O is
`Promise<void> | void`, which `persistence.ts` already returns and which sync
callers can ignore. ActiveRecord then has no `assignAttributes` of its own, as in
Rails, and the guard plus both helpers exist once.

Beware: a non-async body that returns `Promise<void> | void` is required here —
an `async` body defers scalar writes past sync readers (see
`project_async_body_defers_scalar_writes_past_sync_readers`), which is why
`persistence.ts` is spelled the way it is today.

## Acceptance criteria

- `packages/activerecord/src/persistence.ts` no longer defines its own
  `assignAttributes`; AR routes to the ActiveModel port.
- `respondToEachPair` and `classOf` exist once, and remain file-private:
  `pnpm parity:api:extra --package activemodel` keeps `attribute-assignment.ts`
  at 0 novel and adds no `index.ts` row.
- `pnpm vitest run packages/activerecord/src/persistence.test.ts
packages/activerecord/src/attribute-assignment.test.ts
packages/activerecord/src/nested-attributes.test.ts` green, including the
  nested-attribute writers that owe I/O.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
