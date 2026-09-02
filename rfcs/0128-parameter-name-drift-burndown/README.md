---
rfc: "0128-parameter-name-drift-burndown"
title: "Parameter-name drift: converge the 624 renamed parameters the new check found, then gate each package"
status: closed
created: 2026-08-28
updated: 2026-09-02
owner: "@deanmarano"
packages:
  - abstractcontroller
  - actioncontroller
  - actiondispatch
  - actionview
  - activemodel
  - activerecord
  - activesupport
  - globalid
  - rack
  - trailties
clusters:
  - fidelity
related-rfcs:
  - "0126-fidelity-tooling-continuation"
  - "0124-arel-surfaced-deviations"
  - "0023-surfaced-deviations"
  - "0117-extra-surface-gating"
priority: 3
---

# RFC 0000 — Parameter-name drift burndown

## Summary

CLAUDE.md makes the parameter name a first-class fidelity rule — "a local or
parameter keeps the Rails identifier, camelCased — Ruby `stmt` is `stmt`, not
`statement`" — and nothing measured it until
`parity-api-compares-parameter-names-beside-arity` (RFC 0126) landed the check
beside the arity one. Its first full-surface run is the population this RFC
burns down: **624 flagged positions over 553 matched pairs; 5058 of 5611 pairs (90.1%)
spell every parameter Rails' way.**

| package                   | params            | rows |
| ------------------------- | ----------------- | ---- |
| arel                      | 560/560 (100%)    | 0    |
| i18n                      | 79/79 (100%)      | 0    |
| globalid                  | 50/51 (98%)       | 1    |
| abstractcontroller        | 45/48 (93.8%)     | 3    |
| activesupport             | 701/761 (92.1%)   | 63   |
| activerecord-test-support | 10/11 (90.9%)     | 2    |
| actionview                | 128/141 (90.8%)   | 14   |
| activerecord              | 2285/2551 (89.6%) | 302  |
| activemodel               | 290/328 (88.4%)   | 41   |
| actiondispatch            | 439/518 (84.7%)   | 84   |
| rack                      | 204/243 (84%)     | 49   |
| actioncontroller          | 191/228 (83.8%)   | 47   |
| did-you-mean              | 5/6 (83.3%)       | 1    |
| trailties                 | 71/86 (82.6%)     | 17   |

arel is the worked example and the reason the check exists: two hand audits
(PRs #7123 and #7148) found 16 renames there, the check then found 3 more, and
the package is now enrolled in the only-shrink gate at 0. Every other package is
measured and report-only until its own burndown lands, which is what this RFC
schedules.

## Charter

A story belongs here iff its deliverable is **a parameter renamed to the Rails
identifier** in `packages/**`, ending with that package (or that slice of it)
reading 0 rows in `output/param-name-mismatches.json`.

This is deliberately narrow. It is not "signature convergence" in general:

- **Arity** — a TS method taking a different NUMBER of arguments — is the
  existing `arity-exclude.json` register and RFC 0023's problem, not this one.
- **Tooling defects in the check itself** — a false positive, a missing
  recognised convention, a new exemption — are RFC 0126 stories. Two were fixed
  during the seed PR (asymmetric `_` stripping, a hand-picked reserved-word
  list); a third would be one more.
- **A rename that is forced** — a TS reserved word, a splat/kwarg group
  collapsed into an options object, a `this:` receiver — is already recognised
  by the check and is not a row. If a body argues one of these and the check
  still flags it, that is an RFC 0126 story, not a baseline row here.

There is **no baseline and no exclude register for parameter names**, by
construction. The gate is an only-shrink mark whose unit is a count, so the only
way to close a story here is to rename the parameter. A position that genuinely
cannot carry the Rails name has one honest outcome: `pnpm tasks block` with the
language shortcoming named.

## The three shapes in the population

Read the row before renaming — a third of them are not renames at all.

1. **Mechanical rename** — the bulk. `attr_name → attr` / `name` (27 in AR),
   `attributes → attrs` (11), `table → tableName` (9), `model → modelClass` (9),
   `string → s` (9 in AS), `other_hash → other` (7). The Rails identifier,
   camelCased, is the whole fix; the body's references move with it.
2. **Union-type rename** — the port renamed the parameter to describe an
   overloaded TS type: `column_name → columnOrOptions` (6),
   `to_table → toTableOrOptions` (6), `arel_or_sql_string → arel` (4),
   `allow_retry → optsOrCallback`. Rails' name still names the thing the
   parameter IS; the TS type describes what it may be, and belongs in the type,
   not the identifier.
3. **Positional misalignment, reported as a rename** — the port DROPPED a Rails
   parameter or added one, the arity ranges still overlap, and every subsequent
   position lines up against its neighbour.
   `associations/alias_tracker.rb#create` is the clearest: `pool → initialTable,
initial_table → joins, joins → aliases, aliases → quoter` is one dropped
   leading parameter reported four times. `base.rb#_create_record`
   `attribute_names → block` and `abstract_adapter.rb#with_raw_connection`
   `materialize_transactions → callback` are the same shape. These are real
   signature divergences that the arity check cannot see, they are the
   highest-value findings in the set, and they get their own story
   (`param-drift-positional-misalignment-is-a-dropped-parameter`) rather than
   being renamed away inside a mechanical sweep.

## Rollout

Each story converges one package or one slice of `activerecord` (302 rows, split
six ways so no PR exceeds the LOC ceiling), verifying with

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package <pkg> --params
```

**A package reaching 0 enrols in the gate in the same PR**: add it to
`GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
at `{ total: 0, byFile: {} }`. That is the only sanctioned way the set grows —
never to make a red run green, exactly as RFC 0117's extra-surface mark and RFC
0121's `@internal` enrollment set say. `activerecord` enrols in its own story
once all six of its slices land.

Story order is by rows-per-file density, not package size: the packages whose
rows cluster in a handful of files (globalid, abstractcontroller, actionview)
are cheap and enrol early; `activerecord` and `actiondispatch` spread across 30+
files each and are paced behind them.

## Dependencies

Every story depends on `parity-api-compares-parameter-names-beside-arity` (RFC
0126), which lands the check, the artifact, and the mark module these stories
read and extend. Until it merges, `output/param-name-mismatches.json` does not
exist on `main` and no story here can verify its own completion.

## Changelog

- 2026-08-28: the 16 stories are seeded `draft` pending triage. Their
  markdown-owned `priority` tiers are set (1 for the misalignment and tail
  stories, 2–4 for the package sweeps), so promoting them to `ready` is the
  whole of the triage.
- 2026-08-28: created from the first full-surface run of the parameter-name
  check (trails PR #7162), 624 rows across 12 packages.

## Closed 2026-09-02

The goal is met. All 12 packages named in the seed table are enrolled in
`GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and every one of
them carries `{ total: 0, byFile: {} }` in `param-name-mark.json` on
`origin/main` — the 624-row population is at zero and armed, not budgeted.
43 stories are done across 24 `RFC 0128` commits (trails #7171 through #7373).

Two stories are re-homed to `0123-blocked-convergence-holding`, both blocked on
permanent language shortcomings rather than on any 0128 work:
`base-constructor-calls-init-internals-not-activemodel` (JS requires `super()`
before `this`) and `template-render-hands-the-view-to-run` (the residual
`has_strict_locals:` Ruby kwarg).
