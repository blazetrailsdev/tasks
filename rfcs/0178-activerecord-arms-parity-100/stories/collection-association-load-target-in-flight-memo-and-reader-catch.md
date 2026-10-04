---
title: "activerecord: CollectionAssociation#load_target in-flight memo and #reader catch are arms Rails lacks"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `activerecord-converge-invented-control-flow-arms-associations-part-2` (RFC 0178).

Rails' `CollectionAssociation#load_target`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb:272-279`)
is one `if find_target?` arm, and `#reader` (`:35-44`) is `reload if stale_target?`.

trails' `loadTarget` (`packages/activerecord/src/associations/collection-association.ts`) adds three
arms Rails does not have: an in-flight memo (`if (this.#loadingTarget) return …`), a
`if (!this.isLoaded())` re-check inside the `.then`, and the `.finally` that clears the memo.
`reader` adds `if (reloaded instanceof Promise) reloaded.catch(() => {})`.

Removing them was tried in that PR and reds five trails tests that pin the behaviour:
`has-many-mid-flight-reassignment.trails.test.ts` (four cases: concurrent loads on one holder,
a replace landing mid-load) and `collection-association-reader-proxy.trails.test.ts`
("shares the stale reload's in-flight load with the proxy"). `reader` is a synchronous getter, so
its stale `reload` cannot be awaited; dropping the `.catch` leaves a rejected reload unhandled.

Both bodies carry `@inventedArm if` / `@inventedArm try` receipts pointing at this story.

## Acceptance criteria

- [ ] Decide whether the in-flight load memo is a ratifiable language shortcoming (one async
      context holding several in-flight promises, as CLAUDE.md § "The adapter lock defaults to a
      monitor" records for adapters). If so, add the CLAUDE.md section and re-tag the receipts
      `PERMANENT`; if not, converge `loadTarget` / `reader` to the Rails bodies.
- [ ] `pnpm parity:api:arms:throws` green with the receipts updated or removed.
