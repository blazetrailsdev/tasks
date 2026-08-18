---
rfc: "0110-parity-skip-register-correctness"
title: "Skip registers suppress ported surface instead of crediting it"
status: draft
created: 2026-08-18
updated: 2026-08-18
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activesupport"
clusters:
  - "api-compare"
related-rfcs:
  - "0025-fidelity-verification-tooling"
  - "0103-parity-api-scoring-correctness"
  - "0108-call-gate-false-positives"
priority: 2
---

# RFC 0110 — Skip registers suppress ported surface instead of crediting it

## Summary

`SCOPED_SKIP_GROUPS` in `scripts/parity/conventions.ts` grew from 18 names / 9
groups to 164 names / 30 groups between 2026-08-10 and 2026-08-17 — a 9x
increase in seven days, unobserved, because no counter, ratchet or high-water
mark reads it. A read of the entries finds that several do not describe a
language shortcoming at all: they suppress a Ruby method that trails **has
already ported**, dropping it out of the `parity:api` denominator instead of
crediting the port. One entry's stated reason is factually wrong about the
current tree.

This is `parity:api` method-name scoring, not the call gates, so it is out of
scope for RFC 0108 by that RFC's own rule. It is split out of RFC 0025 on the
0108 precedent so it is schedulable on its own; RFC 0025 keeps everything else
and stays postponed.

## Motivation

Measured at each day's last first-parent commit on `main`:

| date       |       `SKIP_GROUPS` |  `SCOPED_SKIP_GROUPS` |
| ---------- | ------------------: | --------------------: |
| 2026-08-10 | 7 groups / 61 names |   9 groups / 18 names |
| 2026-08-17 | 8 groups / 64 names | 30 groups / 164 names |

Derivation: `git show <sha>:scripts/parity/conventions.ts`, brace-scanning each
`export const` array and counting `names:` entries.

A skip is the correct mechanism for a Ruby name with no reasonable TS spelling
— `gc_time` (no JS GC counters), `squish!` (immutable JS primitive), the
Zeitwerk `autoload` family, the Monitor/ShareLock threading cluster. Those are
well-argued and will never burn down; they are not this RFC's target.

The target is entries where the port exists. Four groups, ~11 names:

| group (`rubyFiles`)                       | names                                                                      | the port                                                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `relation.rb`, `relation/calculations.rb` | `build_count_subquery`                                                     | `buildCountSubquery` at `calculations.ts:1298`, JSDoc `Mirrors: …calculations.rb:662-678`, called at `:1343`; `isBuildCountSubquery` ports the `?` predicate |
| `core_ext/module/attr_internal.rb`        | `attr_internal_naming_format`                                              | `getAttrInternalNamingFormat` / `setAttrInternalNamingFormat`, `module-ext.ts:262,266`, both exported from `index.ts:345`                                    |
| `config.rb`                               | `expand_config`, `connection_name`, `test_configuration_hashes`, `connect` | all four in `support/connection.ts` (`:251`, `:71`, `:286`, and `connect`)                                                                                   |
| `adapter_helper.rb`                       | the four `supports_*?` predicates                                          | `support/supports.ts` feature table, keyed on the `supports_<key>?` names (`:153`, `:184`)                                                                   |

Two of these entries say so in their own reason text. The `config.rb` entry
states the four "ARE ported — all four in
packages/activerecord/src/support/connection.ts"; the `adapter_helper.rb` entry
states "the table keys are the `supports_<key>?` names, so the pairing is
checkable". Both then skip rather than pair.

The `build_count_subquery` entry is worse: its reason claims the helper is
"realized inline inside trails' `performCount` … rather than as a separate
named method", which is not true of the current tree. It is extracted, at the
Rails name, citing the Rails lines. Whatever was true when the entry was
written, it now ratifies a divergence that does not exist — and because a skip
is invisible to every gate, nothing would ever have caught that drift.

## Design

Three mechanisms, in increasing order of cost.

1. **Delete or narrow the entry.** Where the port already sits at the mapped
   site, the entry is simply wrong and goes. (`build_count_subquery`.)
2. **Use `tsMirrorName`.** The field at `conventions.ts:539` exists precisely
   for "the TS spelling that IS the faithful port … when there is one but it
   isn't the spelling `rubyMethodToTs` produces", and `messages/rotator.rb`
   uses it correctly today. It is typed as a single `string`, so it cannot
   express a Ruby accessor pair that ports to `getX`/`setX`, nor a name that
   ports into a keyed table entry. Widening it is this RFC's one tooling
   change. (`attr_internal_naming_format`, the `supports_*?` four.)
3. **Retire the entry against the bug it works around.** Where the skip is
   papering over a known comparator bug tracked elsewhere, the entry is a
   second register for debt that already has a home, and it should be deleted
   when that bug is fixed rather than kept in parallel. (`config.rb`, which
   works around the reopened-module bucketing bug that RFC 0025's
   `api-compare-buckets-reopened-module-under-one-file` already owns and which
   is `ready`; `lookup_cast_type`, tracked by
   `pg-lookup-cast-type-async-divergence`.)

## Non-goals

- **A ratchet on the skip counts.** A count gate would have frozen
  `build_count_subquery` at its wrong reason forever rather than catching it —
  the register needs reading, not just counting. A counter may be worth adding
  afterwards; it is not the fix and is deliberately not bundled here.
- **The JSDoc tag registers.** `@noRailsEquivalent` (115 → 201 over the same
  week) and `@missingRailsCall` (9 → 36) are a separate untracked population
  with the same shape. Filed separately.
- **`SKIP_GROUPS` proper.** Nearly flat (61 → 64) and global by construction;
  the growth is entirely in the scoped register.
- **Re-litigating the genuine entries.** The ~25 groups resting on a real
  language shortcoming stay as they are.

## Alternatives considered

- **RFC 0108.** Closest active fit, but its scoping rule is explicit that it
  covers false positives _in the call gates_ and that measurement holes "stay
  in 0025". These are `parity:api` scoring, and `build_count_subquery` is a
  measurement hole. Widening 0108 would break a boundary drawn deliberately.
- **RFC 0025 directly.** Correct population, but postponed with 258 stories,
  which is where this work would stop.
- **RFC 0023.** The historical home for one-off scoped-skip stories
  (`duration-unary-plus-scoped-skip-not-identity`). Rejected: this is a
  coherent tooling population, not surfaced one-offs.
- **Reopening RFC 0103.** Exact thematic match ("parity:api scoring
  correctness residue") but closed with all three stories done; reopening a
  closed RFC to add a new population is worse than a successor.

## Rollout

1. `scoped-skip-suppresses-extracted-build-count-subquery`
2. `ts-mirror-name-cannot-express-multi-name-ports`
3. `artest-config-skip-hides-four-ported-members` (after RFC 0025's
   `api-compare-buckets-reopened-module-under-one-file`)
4. `audit-remaining-scoped-skip-groups-for-ported-surface`

## Verification

`SCOPED_SKIP_GROUPS` contains **zero** entries whose reason asserts the name is
ported; every surviving entry names a language shortcoming or a tracked bug.
Each PR states the `parity:api` delta it causes: stories 1–3 should each _raise_
the denominator (surfaces re-enter the comparison) and raise `matched` by the
same amount, for a net-zero-or-positive percentage move. A story that lowers
`matched` without lowering the denominator has found a real gap and should say so.

## Open questions

1. **Should `tsMirrorName` take `string | string[]`, or a richer
   `{ get, set }`?** Recommendation: `string | string[]`, since the
   `supports_*?` table case is a plain set of names with no reader/writer
   semantics, and the accessor pair is expressible as two names. Resolve
   before this RFC goes `active`.

## Changelog

- 2026-08-18: initial RFC, from the 2026-08-11 → 08-17 parity-burndown audit
