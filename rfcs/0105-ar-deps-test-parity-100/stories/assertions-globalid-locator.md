---
title: "assertions-globalid-locator"
status: ready
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
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

PR #6651 converged four of the five globalid assertion-parity files from
`assertions-globalid-cluster` (`global_id_test.rb`, `uri_gid_test.rb`,
`signed_global_id_test.rb`, `global_identification_test.rb`) — 102 of the 126
divergences. `global_locator_test.rb` was split out to keep that PR under the
LOC ceiling; this story finishes it.

Measured after #6651 (`pnpm parity:test -- --assertions --missing --package globalid`),
against `vendor/globalid/test/cases/global_locator_test.rb`:

| Rails test file          | count | kind | value |
| ------------------------ | ----: | ---: | ----: |
| `global_locator_test.rb` |    24 |   27 |     1 |

The trails counterpart is `packages/globalid/src/global-locator.test.ts`.
`scripts/test-compare/assertion-mismatch-mark.json` holds globalid at
`{24, 27, 1}`; those are exactly this story's rows.

The shapes to converge, all visible in the `--missing` output:

- **`locate_many` result assertions.** Rails writes one
  `assert_equal [ Person.new('1'), Person.new('2') ], GlobalID::Locator.locate_many(…)`
  (`global_locator_test.rb:85`, `:90`, `:95`, `:101`, `:107`, `:113`, `:118`,
  `:194`, `:199`, `:205`, `:210`, `:216`, `:233`, and the two
  `ScopedRecordLocatingTest` cases at `:426`/`:431`). The port asserts
  `toHaveLength` plus a per-element walk, which is where every
  `length rails 0 vs trails 1` and `instanceOf rails 0 vs trails 2` row comes
  from. One `toStrictEqual` against the expected record array replaces the walk
  (`toStrictEqual` checks the class, matching Person#== 's
  `other.is_a?(self.class)` guard at `test/models/person.rb:31`).
- **`only:`-restriction tests.** Rails asserts `assert_kind_of` **and**
  `assert_equal gid.model_id, found.id` (`:26`, `:32`, `:45`, `:152`, `:158`,
  `:171`, `:227`); the port drops the id assertion.
- **`locating by a GID URI with a mismatching model_id returns nil`** (`:265`)
  asserts nil four times; the port has three — the `gid://app/Person/1/2` case
  is missing.
- **`use locator with block` / `with class` / `app locator is case insensitive`**
  (`:272`, `:282`, `:312`) return the Rails sentinels `:foo`, `:bar`,
  `:insensitive` and `['1','2']` from `locate_many`; the port invents its own
  strings, which is the one remaining assertion-value row. `use locator with
class` also drops Rails' second `assert_equal` on `locate_many`.
- **`by many with one record missing not leading to a raise when ignoring
missing`** (`:367`) is a single `assert_nothing_raised`; the port asserts
  length + element instead.
- **`by GID without a primary key method`** (`:372`) asserts `assert_equal 2,
found.length` twice — `equal`, not `toHaveLength`.
- **`use locator with class and single argument`** (`:296`) is `rails 3 vs
trails 2` because Rails' third assertion is the
  `assert_deprecated(nil, GlobalID.deprecator)` wrapper. That one is blocked on
  `globalid-locator-single-argument-deprecation` (JS `Function.length` is not
  Ruby `Method#arity`) — cite it at the call site rather than inventing a
  no-op wrapper.

## Acceptance criteria

- `global_locator_test.rb` reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package globalid`,
  except the single `use locator with class and single argument` count row
  tracked by `globalid-locator-single-argument-deprecation`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowers globalid from
  `{24, 27, 1}` to `{1, 0, 0}`.
- No test name changes; `pnpm parity:test` percent for globalid does not drop
  from 131/131.
- No new rows in `scripts/parity/unported-files/`.
