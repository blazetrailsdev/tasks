---
title: "Retire CONVERGEABLE receipts that cite already-done stories"
status: in-progress
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 6
pr: trails#8020
claim: "2026-09-23T23:32:19Z"
assignee: "adapter-test-leases-connection-as-rails-does"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8004. At least 20 `@noRailsEquivalent CONVERGEABLE` receipts
in activerecord (plus one in activemodel) cite stories whose DB status is
already `done`, so no open story owns the debt they record:

- `association-helpers-extracted-for-the-collection-proxy` (RFC 0123, done),
  cited by e.g. `associations/has-many-association.ts` `setDifference` /
  `setIntersection`, `associations/alias-tracker.ts`, `belongs-to-association.ts`,
  `foreign-association.ts`, `through-association.ts`,
  `has-many-through-association.ts`, `relation/query-methods.ts`.
- `inline-ruby-bodies-extracted-as-named-helpers` (RFC 0119, done), cited by
  `associations.ts:213` and several `connection-adapters/**` files
  (`abstract-adapter.ts`, `abstract-mysql-adapter.ts`, `abstract/quoting.ts`,
  `abstract/schema-definitions.ts`, `mysql/schema-dumper.ts`,
  `mysql/schema-statements.ts`, `sqlite3/schema-statements.ts`).

Enumerate with
`grep -rn "CONVERGEABLE association-helpers-extracted-for-the-collection-proxy\|CONVERGEABLE inline-ruby-bodies-extracted-as-named-helpers" packages/*/src`.

A CONVERGEABLE receipt is only a receipt while its story is open. These are the
same class of unverified claim `relabel-invented-association-helper-permanent-receipts`
retired for PERMANENT tags.

## Converged shape

For each cited name: inline it into its Rails-named caller (per the Rails
`file:line` the original story recorded), or re-point the receipt at an open
story that will remove it. Consider a gate that reds a CONVERGEABLE receipt
whose story is `done`/`closed`.

## Acceptance criteria

- [ ] No `@noRailsEquivalent CONVERGEABLE` receipt cites a done or closed story.
- [ ] `pnpm parity:api:extra:gate` stays green.
