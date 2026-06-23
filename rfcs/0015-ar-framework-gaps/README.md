---
rfc: "0015-ar-framework-gaps"
title: "ActiveRecord framework gaps — dirty-tracking + readonly (test-port surfaced)"
status: active
created: 2026-06-04
updated: 2026-06-22
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - dirty-tracking
  - readonly
---

<!-- Unnumbered until merge: keep `rfc:` as 0015-ar-framework-gaps and the H1
     below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC 0015 — ActiveRecord framework gaps: dirty-tracking + readonly

## Summary

Two trails docs (`dirty-test-framework-gaps.md`, `readonly-test-framework-gaps.md`)
catalogue the **core-framework gaps surfaced while porting `dirty.test.ts`
(PR #2913) and `readonly.test.ts` to faithful, DDL-free mirrors of Rails'
`dirty_test.rb` / `readonly_test.rb`.** Each skipped test names a real gap;
closing it un-skips the listed test(s). They are deliberately **separate
implementation PRs** — they touch shared models + core dirty-tracking /
collection-proxy infrastructure and shouldn't ride a test rewrite. This RFC
turns the **16 fixable gaps** into dep-aware stories; the JS/Ruby-impossible
cases, the PG-only adapter divergences, and the intentional omissions are
recorded in §Deferred (not stories).

## Do as Rails does

Every story closes a divergence from a specific Rails behavior, verified against
the vendored Rails test the port mirrors:

- **dirty-tracking** ≙ `activerecord/test/cases/dirty_test.rb` + `ActiveModel::Dirty`
  (`active_model/lib/active_model/dirty.rb`) — `saved_changes`,
  `previous_changes`, `attribute_will_change!`, partial inserts/updates.
- **readonly** ≙ `activerecord/test/cases/readonly_test.rb` + `ReadonlyAttributes`
  / association readonly propagation (`active_record/associations`).

Stories carry the exact un-skipped test names + the trails source anchors from
the source docs (e.g. `comment.rb:58 def self.all_as_method`, `project.ts:62`).

## Rollout

Pick by cluster; most are 1-test, ~10–40 LOC. Highest-yield first:
`dirty-create-time-capture` (6 tests) and `readonly-hmt-collection-flag` (4).
The only intra-RFC dep: `dirty-enum-from-to-casting` →
`dirty-parrot-virtual-attr-registry` (the enum cast test also needs the Parrot
virtual-attr fix).

## Stories

### dirty-tracking (`dirty_test.rb`)

<!-- generated: stories table -->

| ID                                                                                                | Title                                                              | Status | Est LOC | Cluster        |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------ | ------- | -------------- |
| [wire-public-base-instantiate](stories/wire-public-base-instantiate.md)                           | Wire public Base.instantiate class method                          | ready  | 60      | —              |
| [dirty-alias-under-reflection](stories/dirty-alias-under-reflection.md)                           | Alias dirty under reflection                                       | done   | 30      | dirty-tracking |
| [dirty-attribute-will-change-api](stories/dirty-attribute-will-change-api.md)                     | Public attribute_will_change! API                                  | done   | 40      | dirty-tracking |
| [dirty-create-time-capture](stories/dirty-create-time-capture.md)                                 | Create-time dirty capture for mass-assigned attributes             | done   | 60      | dirty-tracking |
| [dirty-custom-changed-in-place-hook](stories/dirty-custom-changed-in-place-hook.md)               | Custom attribute-type changed_in_place? hook                       | done   | 60      | dirty-tracking |
| [dirty-enum-from-to-casting](stories/dirty-enum-from-to-casting.md)                               | Enum dirty from:/to: casting                                       | done   | 30      | dirty-tracking |
| [dirty-js-date-coercion](stories/dirty-js-date-coercion.md)                                       | JS Date <-> datetime attribute coercion                            | done   | 40      | dirty-tracking |
| [dirty-missing-attribute-error](stories/dirty-missing-attribute-error.md)                         | MissingAttributeError on unselected access                         | done   | 40      | dirty-tracking |
| [dirty-parrot-virtual-attr-registry](stories/dirty-parrot-virtual-attr-registry.md)               | Canonical Parrot virtual attr + model registry                     | done   | 40      | dirty-tracking |
| [dirty-previous-changes-in-place-mutations](stories/dirty-previous-changes-in-place-mutations.md) | Dirty: previous_changes must include in-place mutations after save | done   | 25      | dirty-tracking |
| [dirty-query-count-parity](stories/dirty-query-count-parity.md)                                   | No-op UPDATE / query-count parity                                  | done   | 80      | dirty-tracking |
| [dirty-reflected-in-memory-defaults](stories/dirty-reflected-in-memory-defaults.md)               | Reflected in-memory defaults applied on new                        | done   | 40      | dirty-tracking |
| [dirty-serialize-content-topic](stories/dirty-serialize-content-topic.md)                         | serialize :content on canonical Topic (+ schema)                   | done   | 60      | dirty-tracking |
| [dirty-sql-function-defaults](stories/dirty-sql-function-defaults.md)                             | SQL-function column defaults in defineSchema                       | done   | 40      | dirty-tracking |
| [dirty-tz-datetime-roundtrip](stories/dirty-tz-datetime-roundtrip.md)                             | TZ-aware datetime string round-trip                                | done   | 40      | dirty-tracking |
| [readonly-collection-method-missing](stories/readonly-collection-method-missing.md)               | Collection proxy method_missing delegation (+ Comment.allAsMethod) | done   | 40      | readonly       |
| [readonly-collection-proxy-propagation](stories/readonly-collection-proxy-propagation.md)         | Collection-proxy readonly propagation                              | done   | 40      | readonly       |
| [readonly-hmt-collection-flag](stories/readonly-hmt-collection-flag.md)                           | HMT collection not implicitly marked readonly                      | done   | 60      | readonly       |

## Deferred / out-of-scope (NOT stories)

**Impossible in JS (Ruby-only — permanent skip):** in-place string mutation
(`catchphrase << "…"`; JS strings immutable) — `attribute will change!`,
`in place mutation detection`, `in place mutation for binary`, `mutating and
then assigning…`; per-instance singleton method-with-super override —
`changes is correct if override attribute reader`, `getters with side effects`;
auto-coercing symbol — `string attribute should compare with typecast symbol`.

**Adapter-inconsistent (pass on SQLite + MySQL, skipped on PG via
`it.skipIf(SKIP_ON_PG)`):** datetime read-back `undefined` after `create` on an
anonymous reflected `topics` class (`nullable datetime not marked as changed`,
`…fractional seconds`); save-managed columns (id/timestamps) absent from
`saved_changes` after INSERT on PG (`attributes assigned but not selected are
dirty`, `saved_changes? returns whether…`, `changed? in after/around
callbacks`). Same family as `dirty-create-time-capture`; fixing it on PG would
fold these in — track here, don't dual-story.

**Intentional omissions:** `field named field` (needs in-test `create_table` —
reintroduces per-test DDL); `partial insert off with changed composite identity
PK` (pre-existing connection-pool skip); readonly `assert_not dev.save` (stale
Rails behavior — current vendored Rails raises `ReadOnlyRecord`, the port tests
that).

## Changelog

- 2026-06-04: initial RFC, migrated from `dirty-test-framework-gaps.md` +
  `readonly-test-framework-gaps.md` during the RFC 0011 cutover. Both source docs
  queued for deletion.
- 2026-06-22: reopened `closed` → `active`. `wire-public-base-instantiate`
  (surfaced by PR #3841, added after the RFC was closed) is still `draft`, so
  the RFC is not yet complete.
