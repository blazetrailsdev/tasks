---
rfc: "0040-through-association-source-convergence"
title: "Through-association source/polymorphic reflection convergence"
status: closed
created: 2026-06-21
updated: 2026-06-24
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
related-rfcs:
  - "0023-surfaced-deviations"
  - "0033-standalone-associations-burndown"
---

## Summary

Converge trails' `has_*  :through` source-reflection resolution onto Rails for
the polymorphic and scoped cases. These four stories were surfaced individually
under RFC 0023 but form one coherent body of work on a single subsystem
(`through_reflection` / `source_reflection` and the SQL it generates), so they
get their own RFC with a shared rollout rather than floating in the deviations
bucket.

## Motivation

Through-association source resolution has several tracked divergences from Rails,
all in how the source reflection's type/scope/foreign-key is derived and applied:

- polymorphic `source_type` is not derived from the polymorphic name,
- a polymorphic source does not apply its type condition,
- the source reflection's scope is not merged into the generated query,
- owner column derivation does not delegate to the reflection.

Each is small on its own, but they share fixtures, the same Rails source
(`activerecord/lib/active_record/reflection.rb`,
`associations/through_association.rb`), and the same trails files
(`packages/activerecord/src/reflection.ts`, `associations/`), so converging them
together avoids repeated context re-derivation and overlapping edits.

## Rollout

No hard ordering; ship smallest-first. Each story is independently mergeable and
converges toward Rails (fidelity-first — no deviations are ratified).

- `through-belongsto-source-type-uses-polymorphic-name`
- `through-polymorphic-source-applies-type-condition`
- `through-source-reflection-scope-not-merged`
- `through-owner-cols-delegate-to-reflection`

(Authored under 0023; moved here verbatim — bodies already carry Rails/trails
`file:line` and acceptance criteria.)
