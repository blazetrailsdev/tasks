---
title: "schemaStatements() accessor stands in for Rails include SchemaStatements"
status: draft
updated: 2026-07-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Real Rails deviation surfaced by `extra-surface-adapter-cross-file-recurring-names`
(PR 5345), currently carrying 2 allowlist entries in
`scripts/api-compare/extra-surface-allow.json` (`abstract-adapter.ts`,
`postgresql-adapter.ts`).

Rails gains the schema-statement bodies with `include SchemaStatements` on the
adapter, so there is no accessor to mirror. trails keeps them in a companion
class and exposes `schemaStatements(host?)` returning it bound to a host
adapter; `mysql2-adapter.ts:1439` and `postgresql-adapter.ts:4569` override it to
return their dialect companion, mirroring where Rails includes
`MySQL::SchemaStatements` / `PostgreSQL::SchemaStatements`.

CLAUDE.md's module-mixin convention (`this`-typed functions assigned to the
class, or `include()` / `Included<>` from `@blazetrails/activesupport` for bulk
instance methods) is the repo's stated answer for Ruby `include`. The companion
class predates wide adoption of that pattern and was justified on the grounds
that the schema-statement surface is too large for the mixin pattern to stay
readable.

Re-test that premise. It is a large surface — `schemaStatements()` has ~44 call
sites and the companion classes are among the biggest files in the package — so
this may well come back "keep the companion, allowlist stands". That is a
legitimate outcome, but it should be a measured decision rather than an
inherited one, and if the companion stays it deserves a `@boundary-file`-style
note at the class explaining why it does not use the repo convention.

Sequencing note: `scope-delegate-lookup-by-accessor-return-type` (RFC 0072)
touches `schemaStatements()` return-type resolution; check it before starting.

## Acceptance criteria

- A recorded decision, with the readability/size evidence that drove it.
- If converged: the companion is folded onto the class via the CLAUDE.md mixin
  pattern, the accessor is deleted, its 2 allowlist entries go, and the
  per-dialect override is expressed as the mixin choice Rails' `include` makes.
- If kept: a justification comment at the companion class declaration (not only
  in the allowlist reason), and the allowlist entries cite it.
- Scoped `vitest run` on the touched adapter and migration tests passes; MySQL
  and PostgreSQL suites verified by CI if no local server.
