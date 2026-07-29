---
title: "Interface property signatures are dropped by extractInterface, so syntax choice decides visibility"
status: claimed
updated: 2026-07-29
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-07-29T22:52:32Z"
assignee: "interface-property-signatures-uncounted"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping PR 5467 (`extra-surface-skip-duck-typed-interface-members`)
and confirmed in review.

`extractInterface` (`scripts/api-compare/extract-ts-api.ts`) records a member
only when `ts.isMethodSignature(member)` holds. Property signatures are
dropped, including function-typed ones:

```ts
export interface LocatorModel {
  name: string; // invisible
  primaryKey?: string | string[]; // invisible
  find(id: unknown): Promise<unknown>; // recorded
}
```

The two spellings `find(id): T` and `find: (id) => T` are interchangeable in
TypeScript, so whether a member enters the compared surface depends on the
author's syntax choice rather than on the API. A property-signature port of a
Rails method is invisible to `api:compare` (never counted missing) and to
`api:extra` (never counted extra).

Note the neighbouring `extends`-resolution path in the same function does NOT
have this blind spot — it takes every symbol whose type has call signatures,
which catches both spellings. So the direct-member walk is the inconsistent
half.

Pre-existing, not introduced by PR 5467.

## Acceptance criteria

- An interface property signature whose type has call signatures is recorded
  as a member, matching the `extends`-resolution path in the same function.
- Decide what to do with non-callable property signatures (`name: string`) —
  Rails `attr_reader`s port as getters and DO count elsewhere, so excluding
  them here may be its own divergence; state the rule in the script.
- Re-measure `api:extra` and `api:compare` totals; the new members may surface
  drift that was previously invisible.
