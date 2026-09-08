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

## Classification of every `SCOPED_SKIP_GROUPS` entry (2026-09-08)

Read against `vendor/rails` and the trails tree at trails `main` (5f5ff5b0c), one
row per group in register order. Classes: **(a)** genuine language shortcoming,
**(b)** ported surface that should be credited, **(c)** stale reason, **(d)**
duplicate of debt tracked elsewhere. Every (b)/(c) was established empirically —
the group was deleted and `parity:api` re-run — not by reading alone.

| Ruby file(s)                                                               | Names                                                                              | Class     | Evidence                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `naming.rb`                                                                | `=~`, `!~`                                                                         | a         | no TS operator overload; `String#=~` returns an offset, not the ported boolean `match`                                                                                                                                                                     |
| `notifications/instrumenter.rb`                                            | `gc_time`, `allocations`, `now_gc`, `now_allocations`                              | a         | no JS GC/allocation counters without `node:*`                                                                                                                                                                                                              |
| `number_helper.rb`                                                         | `autoload` family                                                                  | a         | ESM has no autoload                                                                                                                                                                                                                                        |
| `time_with_zone.rb`                                                        | `marshal_dump`, `marshal_load`                                                     | a         | no Marshal in JS                                                                                                                                                                                                                                           |
| `core_ext/time/calculations.rb`                                            | `*_with_*`/`*_without_*` operator chain halves                                     | a         | no operator overloading, no reopening `Date`'s operators                                                                                                                                                                                                   |
| `core_ext/module/redefine_method.rb`                                       | `silence_redefinition_of_method`, `redefine_singleton_method`, `method_visibility` | a         | deleting the group leaves all three `missing` at `class-attribute.ts` — nothing ported to credit                                                                                                                                                           |
| `core_ext/module/aliasing.rb`, `core_ext/module/concerning.rb`             | `alias_attribute`, `concerning`, `concern`                                         | a         | needs `module_eval` + constant assignment                                                                                                                                                                                                                  |
| `core_ext/module/attr_internal.rb`                                         | `attr_internal_define`, `attr_internal_naming_format`                              | a         | deleting the group leaves both `missing` at `module-ext.ts`                                                                                                                                                                                                |
| `core_ext/string/filters.rb`                                               | `squish!`, `remove!`                                                               | a         | JS strings are immutable primitives                                                                                                                                                                                                                        |
| `duration.rb`                                                              | `+@`                                                                               | a         | no unary-plus dispatch in TS                                                                                                                                                                                                                               |
| the five AR value-object files                                             | `-@`                                                                               | a         | no unary-minus method; `deduplicate` is the whole surface                                                                                                                                                                                                  |
| `dirty.rb`                                                                 | `as_json`                                                                          | **c**     | `activemodel/src/dirty.ts:168` is a faithful port of `dirty.rb:264-268`; the reason ("a ported override would be a no-op") no longer describes the tree. **Deleted in this PR** — `dirty.rb` goes 35/35 with the member counted.                           |
| `relation.rb`, `relation/calculations.rb`                                  | `build_count_subquery`                                                             | **b**     | `relation/calculations.ts:730` at the Rails name; handled by `scoped-skip-suppresses-extracted-build-count-subquery` (both seats pair, +2/+2)                                                                                                              |
| `relation.rb`                                                              | `perform_calculation`                                                              | **c**     | `relation/calculations.ts:680` pairs at the `relation.rb` seat too — the reason's claim that it "is not on the Relation class surface relation.rb compares against" is false. **Deleted in this PR**; `relation.rb` stays 402/402 with the member counted. |
| `adapter_helper.rb`                                                        | the four `supports_*?` predicates                                                  | a         | deleting the group leaves all four `missing`; they live as `supports.ts` table keys (`:53`, `:55`) by design                                                                                                                                               |
| `config.rb`                                                                | `config`, `config_file`, `read_config` (+ `expand_config`)                         | a + **b** | (2) genuine: trails ships no `config.yml`. (1) `expand_config` is ported at `support/connection.ts`; handled by `artest-config-skip-hides-four-ported-members`                                                                                             |
| `messages/rotator.rb`                                                      | `initialize`                                                                       | a         | `prepend()` cannot wrap a constructor (correct `tsMirrorName` use)                                                                                                                                                                                         |
| `api.rb`                                                                   | `initialize`                                                                       | a         | `include()` cannot install a constructor                                                                                                                                                                                                                   |
| `dependencies.rb`, `dependencies/autoload.rb`, `dependencies/interlock.rb` | the Zeitwerk family                                                                | a         | no autoload, no reload, no interlock                                                                                                                                                                                                                       |
| the three `acts_like.rb` files                                             | `acts_like_date?`, `acts_like_time?`                                               | a         | ratified by RFC 0098; `Time`/`TimeWithZone` halves are ported and credited elsewhere                                                                                                                                                                       |
| `multibyte.rb`                                                             | `proxy_class`, `proxy_class=`                                                      | a         | its value, default and reader are all absent                                                                                                                                                                                                               |
| `concurrency/share_lock.rb`                                                | the reader-writer lock                                                             | a         | no JS preemption; callers take the null lock                                                                                                                                                                                                               |
| `testing/parallelization/{server,worker}.rb`                               | the DRb fork runner halves                                                         | a         | vitest owns worker parallelism                                                                                                                                                                                                                             |
| `multibyte/chars.rb`                                                       | the `Chars` proxy                                                                  | a         | JS strings iterate by code point already                                                                                                                                                                                                                   |
| `testing/parallelization.rb`                                               | `size`, `shutdown`, fork hooks                                                     | a         | vitest owns parallelism                                                                                                                                                                                                                                    |
| `test_case.rb`                                                             | minitest runner plumbing                                                           | a         | vitest is the runner                                                                                                                                                                                                                                       |
| `testing/declarative.rb`                                                   | `test`                                                                             | a         | vitest discovers nothing by reflection                                                                                                                                                                                                                     |
| `concurrency/load_interlock_aware_monitor.rb`                              | `Monitor` subclass members                                                         | a         | no threads, no interlock                                                                                                                                                                                                                                   |
| `cache/memory_store.rb`                                                    | `synchronize`                                                                      | a         | no threads to serialize                                                                                                                                                                                                                                    |
| `cache/file_store.rb`                                                      | `lock_file`                                                                        | a         | no `flock` in the allowed async fs surface                                                                                                                                                                                                                 |
| `headers.rb`                                                               | `key?`                                                                             | a         | mapped spelling occupied by a different Ruby method (correct `tsMirrorName` use)                                                                                                                                                                           |

Two further findings, both fixed here rather than filed:

- The `messages/rotator.rb` reason cited `packages/activesupport/src/prepend.ts`;
  `prepend()` lives at `packages/ruby-compat/src/prepend.ts`. (c), corrected.
- Two `file:line` citations had drifted (`headers.ts:77` → `:52`,
  `time-with-zone.ts:955` → `:858`). Corrected.

No (b)/(c) finding is left recorded only in this table.
