---
title: "Retag the load_additional_types receipt PERMANENT, then close the pg-get-oid-type story"
status: done
updated: 2026-09-10
rfc: "0145-async-on-demand-adapter-lookups"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#7675
claim: "2026-09-10T20:43:37Z"
assignee: "retag-load-additional-types-receipt-permanent-and-close"
blocked-by: null
closed-reason: null
---

## Context

RFC 0145's decision (2026-09-10) resolved the PG type-map cluster: Rails
reloads its type map at all eight of its own DDL points
(`postgresql_adapter.rb:478,489,559,575,584,602,615` plus
`configure_connection:996`), trails mirrors every one, and a type created by
raw `execute` or by another session is outside ActiveRecord's API on both
sides. `getOidType` and `lookupCastType` stay synchronous, and the live
`::regtype` query and `load_additional_types([oid])` are recovery from
out-of-API staleness rather than behavior to converge onto.

`measure-the-pg-type-map-staleness-gap` and
`pg-lookup-cast-type-misses-types-created-after-the-type-map-load` closed on
that decision. `pg-get-oid-type-drops-the-on-demand-load-additional-types`
cannot close yet for one mechanical reason: its id is cited in a JSDoc receipt
in the source tree, and closing a story cited in code reds the
stale-story-references gate.

The receipt is at
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:574`:

```text
@missingRailsCall load_additional_types — CONVERGEABLE pg-get-oid-type-drops-the-on-demand-load-additional-types
```

`CONVERGEABLE` is now the wrong permanence. The RFC decided the omission is
permanent, so the receipt has to say so before the story it points at can go
away.

## Acceptance criteria

- [ ] The receipt at `postgresql-adapter.ts:574` reads
      `@missingRailsCall load_additional_types — PERMANENT`, with no story id.
- [ ] The tag stays a multi-line JSDoc — a one-line JSDoc does not register the
      tag, and `no-freeform-comments` will autofix prose away, so no explanatory
      sentence is added alongside it.
- [ ] `pnpm parity:api:calls` is green with no new baseline row.
- [ ] `pg-get-oid-type-drops-the-on-demand-load-additional-types` is closed via
      `tasks close`, with the RFC 0145 decision as its reason — **after** the
      retag lands, not before.
- [ ] `pnpm vitest run scripts/stale-story-references.test.ts` is green.

## Definition of done

Closing the story before the retag lands does not close this one: the gate reds
on a code citation of a closed story, which is the exact ordering this story
exists to get right.

## Verification

`pnpm parity:api:calls` and
`pnpm vitest run scripts/stale-story-references.test.ts`, then
`git grep pg-get-oid-type-drops-the-on-demand-load-additional-types` returning
nothing outside the tasks repo.

## Notes

Do the retag and the close in that order, in one sitting — a merged retag with
no close leaves an orphan `PERMANENT` receipt and a story that still looks live.
