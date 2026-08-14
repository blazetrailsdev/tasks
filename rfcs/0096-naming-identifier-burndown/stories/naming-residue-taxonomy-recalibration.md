---
title: "Re-derive the naming residue taxonomy: it is ~73% unconvergeable in AR, not the ~6% the gate flip assumes"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6506
claim: "2026-08-14T01:57:12Z"
assignee: "converged-row-stale-mark-forces-whole-tree-reseed"
blocked-by: null
closed-reason: null
---

## Context

`naming-gate-flip` is blocked on a precondition it may never reach as written:
"unblock once [the wave-2/3 burndown stories] land and the report shows only the
tooling-shaped residue", sized from RFC 0095's disposition at **~6% tooling
residue** (a chained Ruby call recorded by its last name, a nested call recorded
as a `ref:`).

PR #6459 (wave 3, the three AR slots) measured that assumption directly. It read
**all 78 surviving activerecord `naming` rows** against `vendor/rails` and found
**~57 of 78 (73%) cannot close by any rename** — an order of magnitude above 6%,
and, more importantly, **most are not the tooling shape the flip plans to
baseline**. The residue decomposes into classes the disposition does not name:

1. **JS reserved words.** `postgresql-adapter.ts#extract_default_function`'s
   second parameter is Ruby `default`
   (`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:781`),
   which is not a legal JS identifier.
2. **Ruby constructs with no JS equivalent.** `object_id`
   (`connection_adapters/abstract_adapter.rb:345`), `Array#last` vs `.at(-1)`,
   `Float(x)` (`postgresql/oid/point.rb`), `.size` vs `.length` (many).
3. **Repo-wide convention renames the recorder cannot see through.**
   `@callbacks` -> `_callbacks`, `primary_class?` -> `primaryClassQ`. These are
   _correct_ per `docs/ruby-ts-conventions.md`; the recorder compares the raw
   identifiers.
4. **Module-mixin receiver passing.** ~12 AR rows where a ported module function
   takes the receiver as a leading parameter and Ruby writes `self`. Tracked by
   `module-mixin-receiver-this-typed` — genuinely convergeable, but by rewiring,
   not renaming.
5. **Structural a3.** ~9 AR rows tracked by
   `naming-burndown-3-ar-structural-residue`.
6. **Actual tooling shape** (the disposition's category) — the minority.

## Why this matters to the flip

The flip's step 2 says the residue "gets baselined with reviewed reasons".
Classes 1-3 above are permanent and want a _reason taxonomy_, not one bespoke
sentence per row; class 4-5 are convergeable and should not be baselined at all.
Seeding them all under one placeholder-shaped reason would enshrine convergeable
divergence in a baseline, which is exactly what CLAUDE.md's "converge, never
ratify" forbids.

Wave-3 sibling slots almost certainly carry the same miscalibration in their own
acceptance thresholds: `naming-burndown-3-ar-adapters` (>=18 of 26),
`-ar-persistence-relation` (>=18 of 26) and `-ar-model-encryption-tasks` (>=30 of 47) were all unreachable for this reason, and #6459 closed none of them.

## Acceptance criteria

- [ ] Re-measure the `naming` population repo-wide and classify it by the six
      classes above (or a better taxonomy), with counts per class per package.
- [ ] Split the permanently-unconvergeable classes (1-3) from the convergeable
      ones (4-6); the former get a shared, reviewed reason string per class, the
      latter stay as burndown work and are never baselined.
- [ ] Correct `naming-gate-flip`'s `blocked-by` precondition to the measured
      residue rather than the ~6% estimate, and correct the remaining wave-3
      story thresholds to their reachable counts.
- [ ] RFC 0095 `## Naming-dimension disposition` and RFC 0096 record the
      corrected taxonomy so the next wave is not sized off the old number.
