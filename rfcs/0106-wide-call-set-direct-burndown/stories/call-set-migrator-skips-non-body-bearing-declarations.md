---
title: "call-set-migrator-skips-non-body-bearing-declarations"
status: ready
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:build` (`scripts/api-compare/build.ts`) migrates a reviewed
`call-mismatches-exclude` row to a `@missingRailsCall` JSDoc tag at the call
site. It refuses six rows in the RFC 0106 tail with

    unmatched (<file>): <tsName> — no body-bearing declaration

so those rows cannot leave the baseline by the sanctioned route even though
their reasons are already reviewed and per-site. Measured 2026-08-21:

    activerecord  aggregations.ts                        composedOf            include
    activerecord  associations/through-association.ts    targetScope           drop
    activerecord  connection-adapters/sqlite3/quoting.ts quoteString           quote
    activerecord  integration.ts                         canUseFastCacheVersion with_connection
    activerecord  secure-password.ts                     authenticateBy        map
    activesupport core-ext/date-and-time/zones.ts        inTimeZone            acts_like?

The common shape is a declaration that is not a `MethodDeclaration` /
`FunctionDeclaration` — a `this`-typed exported function assigned onto the class
(the settled trails mixin idiom, CLAUDE.md "Module mixins"), a property assigned
an arrow function, or an object-literal method. `build.ts` resolves the tag
target through the body-bearing-declaration lookup only, so the mixin idiom the
repo mandates is exactly the shape the migrator cannot reach.

RFC 0106's exit condition is 0 `kind: "set"` rows for `activerecord`, `arel` and
`activesupport`, so these six rows block the exit until the migrator can key a
tag onto those declaration forms.

## Acceptance criteria

- [ ] `parity:api:build` mints a `@missingRailsCall` tag on a `this`-typed exported function, an arrow-function property, and an object-literal method — the declaration forms behind the six rows above.
- [ ] `pnpm parity:api:calls` credits the minted tag (the suppression round-trips), and `pnpm parity:api:detached` stays green for the new tag placements.
- [ ] The six rows above are migrated and their shards deleted, not committed as `[]`.
- [ ] `parity:api:build` is idempotent on the new forms: a second run produces zero edits.
- [ ] Unit coverage in `scripts/api-compare/` for each newly-supported declaration form.
