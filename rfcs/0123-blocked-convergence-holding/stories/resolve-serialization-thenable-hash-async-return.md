---
title: "Resolve serialization's thenableHash dual sync/async return"
status: closed
updated: 2026-09-02
rfc: "0123-blocked-convergence-holding"
cluster: "api-compare"
packages: ["activemodel"]
deps:
  - serializable-hash-async-return-boundary
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-23T14:27:28Z"
assignee: "resolve-serialization-thenable-hash-async-return"
blocked-by: null
closed-reason: "Blocker resolved by trails#7406 (merged): the cross-package async-boundary decision was made and ratified repo-wide in CLAUDE.md 'Serialization's dual sync/async hash' under option (b) of serializable-hash-async-return-boundary. The thenable STAYS — thenableHash / asJsonThenable / preloadIncludes now carry @noRailsEquivalent PERMANENT receipts. This story existed to remove them by making serializableHash / asJson return Promise unconditionally, which the ratified decision rejects, so it cannot be worked as written. Follow-up on the ratification prose is filed as strengthen-async-boundary-ratification-argument (RFC 0134)."
---

## Context

`packages/activemodel/src/serialization.ts:473` `thenableHash` (35 code lines)
returns a `Proxy` that behaves as a plain hash **and** as a thenable, so that
`serializableHash` / `asJson` work both synchronously and under `await`. With
`asJsonThenable` (`:449`, 17), `isSerializableCollection` (`:542`) and
`sendAssociation` (`:524`) it is 67 code lines with no Rails counterpart, and a
shape no Rails developer would recognise.

The cause is real: Ruby's `serializable_add_includes`
(`serialization.rb:191`: `if records = send(association)`) reads associations
synchronously; in trails an association read is async, so an `include:`-bearing
`serializable_hash` cannot be synchronous.

## Why this is blocked, not ratified

Per CLAUDE.md, a deviation-convergence story never closes by writing a better
justification. The two real options are:

- **(a)** `serializableHash` / `asJson` return `Promise` unconditionally and
  every sync caller in `activemodel`, `activerecord` and `actionview` is
  converged. There is precedent: RFC 0063 made `isValid()` return
  `Promise<boolean>` for the same reason, and the repo treats that as settled.
- **(b)** the thenable stays and is tagged `@noRailsEquivalent PERMANENT` with
  the async-boundary evidence.

(a) is the recommendation, but it is a cross-package async-boundary decision
that is out of scope for a bloat-burndown story and needs its own RFC — the
same way RFC 0063 got one. This story is registered `blocked` on that RFC
existing.

**Blocker to file before this can move:** an RFC (or a story under
`0023-surfaced-deviations`) covering "serializableHash returns Promise
unconditionally", listing the sync call sites. Grep seed:
`grep -rn "serializableHash\|asJson(" packages/{activemodel,activerecord,actionview}/src --include=*.ts | grep -v test`.

## Acceptance criteria

- `thenableHash`, `asJsonThenable` and their supporting predicates are gone,
  and `serializableHash` / `asJson` have one return shape.
- Or: the async-boundary RFC has explicitly ratified the thenable, and the tag
  cites that RFC by number.
- No third option — do not broaden a baseline reason to close this.
