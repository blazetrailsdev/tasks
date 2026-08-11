---
rfc: "0096-naming-identifier-burndown"
title: "Local/parameter identifier burndown (call-argument `naming` class)"
status: active
created: 2026-08-10
updated: 2026-08-11
owner: "@your-handle"
packages:
  - activerecord
  - arel
  - activesupport
  - activemodel
clusters:
  - "api-compare"
related-rfcs:
  - "0095-call-argument-parity"
priority: 2
---

## Summary

Burn down the `naming` class of the RFC 0095 call-argument dimension: **883
call sites where a ported body passes an argument whose local/parameter
identifier was renamed away from Rails'**. Nothing else in the repo measures
this — `parity:api` matches method names, `parity:api:calls` matches call names, and
`arity.ts` counts declaration-site parameters.

Every row is the same CLAUDE.md violation:

> A local or parameter keeps the Rails identifier, camelCased — Ruby `stmt` is
> `stmt`, not `statement`; `klass` is `klass`, not `modelClass`. This is free
> fidelity and it is most of what makes a body readable next to the Ruby.

## Motivation

Measured on a full 15-package `API_COMPARE_FORCE=1 pnpm parity:api --calls`
(2026-08-10): 883 `naming` rows, 55% of the 1,619-row call-argument population,
over 5,618 compared call sites. The (a)-genuine rate is **94%** (n=32 seeded
random sample, each pair read against its vendored Ruby); the residue is two
tooling shapes — a chained Ruby call recorded by its last name
(`Regexp.escape(suffix.to_s)` → `ref:toS`) and a nested call recorded as a
`ref:` — which belong in the baseline with a reason.

Cause distribution over the 988 differing argument positions:

| Cause                         | Positions | Share |
| ----------------------------- | --------: | ----: |
| Rails word → unrelated word   |       557 |   56% |
| Rails word → decorated word   |       153 |   15% |
| Rails word → abbreviation     |       140 |   14% |
| Rails word → single letter    |        91 |    9% |
| Rails single letter → word    |        36 |    4% |
| single letter → single letter |        11 |    1% |

85% is a Rails word rewritten to a different word — mechanical to converge and
individually low-severity, which is exactly why it is worth burning down in
bulk rather than one row at a time inside unrelated PRs.

Some rows are stronger than a rename and only this dimension sees them:
`cache/file-store.ts#deleteEntry` passes `dirname(filePath)` where Rails passes
`File.dirname(key)` (`file_store.rb:135`, where `key` already IS the path), and
`schema-dumper.ts#removePrefixAndSuffix` calls a local `escape` helper Rails
does not have (`schema_dumper.rb:371`).

## Design

Each story renames locals and parameters in **one package's files** to the Rails
identifiers, camelCased per `docs/ruby-ts-conventions.md`, and verifies with
`pnpm parity:api:calls:args:report` that its package's `naming` count drops by the
rows it converged. No behavior changes and no public surface changes: these are
body-local identifiers.

Rules for every story:

- **Non-overlapping file sets.** A repo-wide identifier rename touching every
  visitor and relation file at once conflicts with every sibling agent. Stories
  are scoped per package, and the largest packages are split by file cluster.
- **Rename to the Rails identifier, not to a better one.** If the Rails name is
  `o`, the TS name is `o`.
- **A row that turns out to be an a1 (order) or a3 (invented helper /
  conversion) finding is NOT renamed away.** File it against the RFC owning
  that file and leave the row.
- The `naming` class stays **report-only** throughout. It flips to gated in
  `lint-call-args.ts` only when the last story here lands — that flip is the
  campaign's closing story.

## Scope: activerecord and its dependencies only (2026-08-11)

This RFC is scoped to the **data layer** — activerecord, activemodel,
activesupport, arel, and the adapter/connection code activerecord depends on.
`actiondispatch`, `actionview`, `actioncontroller` and `rack` were dropped from
`packages` on 2026-08-11, and the wave-1/wave-2 stories for them
(`naming-burndown-2-actiondispatch-routing-middleware`,
`naming-burndown-2-actiondispatch-http`, `naming-burndown-2-actionview`,
`naming-burndown-2-actioncontroller`, `naming-burndown-2-rack`) were closed as
out of scope. Done/closed stories from before that date stay put as history.

**Do not file new actionpack / actiondispatch / actionview / actioncontroller /
rack / actionmailer / activejob / actioncable / activestorage / railties work
here.** The `naming` rows in those packages are real, but they need their own
RFC. Rows 5, 8 and 9 in the Rollout list below are therefore **out of scope and
will not be worked** — they are left in place so the row arithmetic in
Motivation still reconciles.

## Rollout

Per-package stories, largest first, each independently claimable:

1. `naming-burndown-activerecord-adapters` — 71 rows (postgresql-adapter,
   abstract/schema-statements, abstract-adapter, abstract-mysql-adapter,
   sqlite3-adapter).
2. `naming-burndown-activerecord-relation` — 46 rows (relation.ts,
   relation/query-methods.ts, relation/\*).
3. `naming-burndown-activerecord-rest` — the remaining ~291 activerecord rows,
   split further at claim time if a bundle exceeds the LOC ceiling.
4. `naming-burndown-arel` — 109 rows (visitors/to-sql.ts 28, select-manager 14,
   attributes/attribute 10, tail).
5. ~~`naming-burndown-actiondispatch` — 85 rows.~~ (out of scope, see Scope)
6. `naming-burndown-activesupport` — 84 rows (cache.ts alone is 35).
7. `naming-burndown-activemodel` — 49 rows.
8. ~~`naming-burndown-rack` — 42 rows.~~ (out of scope, see Scope)
9. ~~`naming-burndown-actionview-actioncontroller` — 60 rows.~~ (out of scope, see Scope)
10. `naming-burndown-tail` — globalid, i18n, trailties, abstractcontroller,
    did-you-mean (46 rows combined).
11. `naming-gate-flip` — gate `naming` alongside `shape` in
    `lint-call-args.ts`, seed whatever residue remains (the tooling-shaped
    rows) with reviewed reasons.

## Non-goals

- **Not the `shape` class.** That is gated already (RFC 0095).
- **Not a rename of methods, classes or fields.** `parity:api` owns those.
- **Not non-data-layer packages.** See Scope: actionpack and friends are out.
- **Not a normalization rule for the ~6% tooling residue.** Those rows carry a
  baseline reason at the gate flip.

## Provenance

Decided by `call-args-naming-dimension-disposition` (RFC 0095), 2026-08-10; the
measurements and the sample classification are recorded in RFC 0095's
`## Naming-dimension disposition` section.
