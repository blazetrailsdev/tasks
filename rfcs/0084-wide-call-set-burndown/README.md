---
rfc: "0084-wide-call-set-burndown"
title: "Wide call-set burn-down"
status: draft
created: 2026-07-30
updated: 2026-07-30
owner: "@your-handle"
packages:
  - "activerecord"
  - "arel"
  - "actiondispatch"
  - "actioncontroller"
  - "activesupport"
clusters:
  - "api-compare"
related-rfcs:
  - "0047"
  - "0083"
---

# Wide call-set burn-down

## Summary

Drive the RFC 0047 wide call-set ratchet to zero by converging the entries that
represent real call-shape divergence between a Rails body and its trails port.

This RFC covers **only genuine divergence**. The tooling artifacts that
currently dominate the list are the sibling RFC's job
(`0083-wide-call-ratchet-noise-reduction`), and this RFC does not start until
that one has removed them — burning down a list that is mostly noise wastes the
effort on entries that were never fidelity gaps.

## Starting population

The 2026-07-30 investigation measured the live artifact (5038 rows, 4794
baseline keys) and classified every row by cause. After the sibling RFC's
noise-reduction lands, the projected residual is **~1400–1900 rows**, with a
hard floor of **931 rows** classified `GENUINE (same-file candidate that takes
args)` — a ported helper that exists in the same TS file, takes arguments, and
the body simply does not call.

Spot-check confirming the class is real: Rails'
`visit_Arel_Nodes_DeleteStatement` builds its WHERE clause through
`collect_nodes_for` and its limit through `maybe_visit`; trails'
`visitArelNodesDeleteStatement` (`packages/arel/src/visitors/to-sql.ts:211`)
inlines both. That is a genuine structural divergence and exactly what the gate
exists to catch.

## Bundles

Sized from the post-noise-reduction projection. Row counts move as the sibling
RFC lands, so each bundle story re-measures before splitting into PRs.

| Bundle | Scope                                                                                                          | ~Rows | ~PRs |
| ------ | -------------------------------------------------------------------------------------------------------------- | ----: | ---: |
| B1     | arel visitors — `collect_nodes_for`, `maybe_visit`, `infix_value` inlined instead of called                    |   ~90 |    3 |
| B2     | permanent-deviation annotation — `synchronize` (~30) plus the 349 already-verified equivalents                 |  ~380 |    2 |
| B3     | associations — `association.ts`, `collection-association.ts`, `autosave-association.ts`                        |   ~70 |    2 |
| B4     | AR relation cluster — `relation.ts`, `relation/query-methods.ts`, `relation/calculations.ts`                   |  ~230 |  6–8 |
| B5     | adapter cluster — pg / sqlite3 / abstract-mysql / schema-statements / database-statements                      |  ~200 |    6 |
| B6     | non-AR — actiondispatch mapper + route-set, actioncontroller base + strong-parameters, activesupport callbacks |  ~110 |    4 |

Recommended order: **B1 → B2 → B3 → B4 → B5 → B6.**

- **B1 first**: self-contained, mechanical, no cross-cutting state — the right
  shape to validate that the post-noise-reduction list is actually actionable.
- **B2 is annotate-only**, not code convergence. These entries are permanent and
  correct (Ruby guards with `Mutex#synchronize`; trails is single-threaded).
  Hard-blocked on the sibling RFC's `missing-rails-call-tag-suppresses-wide-flag`
  — without it a tag cannot remove a baseline entry.
- **B3 largely evaporates** under the sibling RFC's property-access story; audit
  the remainder rather than assuming the projected count.
- **B4 is the most entangled** and overlaps existing relation-delegation work.
- **B5 has known blockers**: the adapter write-method divergence from the base
  class, and RFC 0013's pg raw-connection refinement. Expect some entries to be
  registered as blocked rather than converged.

## Dependencies

- Blocked in full on `0083-wide-call-ratchet-noise-reduction` reaching at least
  `ruby-extractor-record-call-receiver-kind` and
  `resolve-wide-candidates-through-include-graph`.
- B2 additionally blocked on
  `missing-rails-call-tag-suppresses-wide-flag`.

## Non-goals

- No tooling changes — those belong to the sibling RFC. If a bundle turns up a
  new tooling artifact, file it there rather than working around it here.
- Not converging entries that are correct deviations. Where the port is right
  and Rails' call is genuinely not applicable, the outcome is a reasoned
  `@missingRailsCall` tag, not a code change. Deviations still converge by
  default — the burden is on the entry to justify itself.

## Why bundle stories, not per-PR stories

The exact residual population is not knowable until the sibling RFC's audit
(`audit-wide-cross-file-mixin-attribution`) and receiver-scoping land; the
projections here come from instrumented probe runs on the 2026-07-30 tree.
Registering 25 per-PR stories now would pin work to counts that are going to
move. Each bundle story therefore begins by re-measuring with `--report` and
splitting itself into PR-sized slices, registering follow-up stories under this
RFC.
