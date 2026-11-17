---
rfc: "0245-i18n-test-parity-100"
title: "i18n: 100% test parity with the vendored i18n gem"
status: draft
created: 2026-11-17
updated: 2026-11-17
owner: "@deanmarano"
packages:
  - i18n
clusters:
  - api-mixins
  - backend-mixins
  - gettext
  - residuals
related-rfcs:
  - "0074-i18n-parity"
  - "0156-parity-beyond-name-presence"
  - "0193-small-gem-ports-parity-100"
---

# RFC 0245 — i18n: 100% test parity with the vendored i18n gem

## Summary

Bring `packages/i18n` to 100% `parity:test` against `vendor/i18n/v1.14.8/test/`:
every Ruby test either has a name-matched trails test, or is permanently
unportable under a ratified CLAUDE.md section and carries the receipt that
section prescribes. Today i18n measures **459/857 (53.6%)**, and that
denominator omits **19 Ruby test files** that `scripts/parity/unported-files/i18n.ts`
excludes as "Pre-1.0" deferrals. This RFC closes the measured gap, retires each
deferral that is not a ratified permanent limit, and names the ones that are.

## Motivation

Measured on 2026-11-17 at `121f1dafb6` with
`pnpm parity:test -- --package i18n --missing`:

```text
i18n — 459/857 tests (53.6%) (4 skipped) | 19/19 files | 0 misplaced
api/chain_test.rb      api/chain.test.ts      39 OK  1 skip  103 miss  143
api/fallbacks_test.rb  api/fallbacks.test.ts  39 OK  1 skip  103 miss  143
api/key_value_test.rb  api/key-value.test.ts  39 OK  1 skip   85 miss  125
api/simple_test.rb     api/simple.test.ts     39 OK  1 skip  103 miss  143
(the other 15 files are 100%)
```

All 394 missing tests come from the `I18n::Tests::*` mixins
(`vendor/i18n/v1.14.8/lib/i18n/tests/`) that trails#10259 enrolled in
`LIB_TEST_MODULES` and half-ported. Basics, Defaults, Lookup and Pluralization
are ported (`packages/i18n/test/support/tests/*.ts`). Missing per mount:

| Ruby module                     | File                                  | Tests | Mounted by                               |
| ------------------------------- | ------------------------------------- | ----: | ---------------------------------------- |
| `Tests::Interpolation`          | `lib/i18n/tests/interpolation.rb`     |    24 | chain, fallbacks, key_value, simple      |
| `Tests::Link`                   | `lib/i18n/tests/link.rb`              |     7 | chain, fallbacks, key_value, simple      |
| `Tests::Procs`                  | `lib/i18n/tests/procs.rb`             |     9 | chain, fallbacks, simple (not key_value) |
| `Tests::Localization::Date`     | `lib/i18n/tests/localization/date.rb` |    21 | all four                                 |
| `Tests::Localization::DateTime` | `.../localization/date_time.rb`       |    17 | all four                                 |
| `Tests::Localization::Time`     | `.../localization/time.rb`            |    16 | all four                                 |
| `Tests::Localization::Procs`    | `.../localization/procs.rb`           |     9 | chain, fallbacks, simple (not key_value) |

That is 103 per mount (85 for key_value, which comments out both Procs
modules, `test/api/key_value_test.rb:9,14`).

The unmeasured remainder is the 19 excluded files (test counts by
`grep -cE '^\s*(test |def test_)'`):

| Ruby test file                           | Own tests | Mixins mounted | Lib file (lines)                                              |
| ---------------------------------------- | --------: | -------------- | ------------------------------------------------------------- |
| `backend/cascade_test.rb`                |         8 | —              | `backend/cascade.rb` (56)                                     |
| `api/cascade_test.rb`                    |         1 | all 11         |                                                               |
| `backend/memoize_test.rb`                |         5 | —              | `backend/memoize.rb` (54)                                     |
| `api/memoize_test.rb`                    |         2 | all 11, twice  |                                                               |
| `backend/pluralization_test.rb`          |        13 | —              | `backend/pluralization.rb` (96)                               |
| `backend/pluralization_fallback_test.rb` |         2 | —              |                                                               |
| `backend/pluralization_scope_test.rb`    |         2 | —              |                                                               |
| `api/pluralization_test.rb`              |         1 | all 11         |                                                               |
| `backend/lazy_loadable_test.rb`          |        13 | —              | `backend/lazy_loadable.rb` (184)                              |
| `api/lazy_loadable_test.rb`              |         1 | all 11         |                                                               |
| `backend/cache_file_test.rb`             |         3 | —              | `backend/cache_file.rb` (36)                                  |
| `i18n/middleware_test.rb`                |         2 | —              | `middleware.rb` (17)                                          |
| `gettext/api_test.rb`                    |        34 | —              | `gettext.rb` (28), `gettext/helpers.rb` (75)                  |
| `i18n/gettext_plural_keys_test.rb`       |         3 | —              |                                                               |
| `gettext/backend_test.rb`                |        11 | —              | `backend/gettext.rb` (83), `gettext/po_parser.rb` (329, racc) |
| `backend/cache_test.rb`                  |        10 | —              | `backend/cache.rb` — **permanent**                            |
| `backend/metadata_test.rb`               |         8 | —              | `backend/metadata.rb` — **permanent**                         |
| `backend/interpolation_compiler_test.rb` |         9 | Interpolation  | `backend/interpolation_compiler.rb` — **permanent**           |
| `api/all_features_test.rb`               |         1 | all 11         | Cache + Metadata — **permanent**                              |

Plus three test-level rows in `scripts/parity/unported-files/baseline.json`
against `i18n_test.rb` that are now stale (see
`i18n-test-rb-retire-thread-fiber-version-rows`).

## Prior art (reused, not duplicated)

- **RFC 0074 `i18n-parity`** (closed) built `packages/i18n`.
- **RFC 0156**: `i18n-api-tests-mount-lib-test-modules-unmeasured` (shipped as
  trails#10259; its row still reads in-progress) enrolled `I18n::Tests::*` and
  ported four mixins. Its three follow-ups stay in 0156 and are this RFC's
  Phase 1. This PR adds `est-loc`, `packages` and acceptance criteria to them,
  and narrows `i18n-api-tests-port-procs-and-localization`, which said "split
  further if over the PR ceiling":
  - `i18n-api-tests-port-interpolation-and-link`
  - `i18n-api-tests-port-procs-and-localization` (now Procs +
    `Localization::Date`)
  - `i18n-api-tests-port-missing-api-test-files` (now depends on the backend
    mixin stories below)
- **RFC 0193**: `i18n-backend-cache` closed `PERMANENT` (correct, kept).
  `port-i18n-backend-cache-file` closed `PERMANENT` on the same ruling, but
  `CacheFile` never reaches `Backend::Cache` or a cache store. It overrides
  `load_file` (`vendor/i18n/v1.14.8/lib/i18n/backend/cache_file.rb:17-25`), which
  is the awaited load step that § "A translation lookup is synchronous" puts
  the asynchrony in. See Open question 1. `i18n-port-backend-cache-file` is
  filed as its replacement if the operator agrees.
- **RFC 0154** `i18n-rfc4646-inherits-struct-from-ruby-compat` and **RFC 0082**'s
  `i18n-*` stories are fidelity work, not test parity. They are left where they are.

## Design

### Permanently unportable tests

Each is parked as `it.skip` under a `PERMANENT-SKIP:` line citing the
section, or kept as a `PERMANENT:` unported-files row, as that section
prescribes. None of these is a new decision.

| Tests                                                                                                                          | Section                                                                                                                                                                                                                                                                  | Shape                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `backend/cache_test.rb` (10)                                                                                                   | packages/i18n/CLAUDE.md § "A translation lookup is synchronous; the load is an awaited step"                                                                                                                                                                             | existing `PERMANENT:` unported-files row                               |
| `api/all_features_test.rb` (1 + mounted)                                                                                       | same section (its `Backend` includes `I18n::Backend::Cache`, `test/api/all_features_test.rb:13`), and § "Ruby Strings are JS string primitives" (it includes `Metadata`, `:12`)                                                                                          | unported-files row reworded to `PERMANENT:`                            |
| `backend/metadata_test.rb` (8)                                                                                                 | § "Ruby Strings are JS string primitives (no mutable String carrier)": metadata is an ivar on the translated String (`backend/metadata.rb:25-35`); and § "Core extensions are not installed on native prototypes": it defines `Object#translation_metadata` (`:23-36`)   | unported-files row reworded to `PERMANENT:`                            |
| `backend/interpolation_compiler_test.rb` (9 + mounted Interpolation)                                                           | § "Runtime facts Node does not expose" (`eval` of generated Ruby): the compiler emits Ruby source and `instance_eval`s it on the String (`backend/interpolation_compiler.rb:26-37`); and § "Ruby Strings are JS string primitives" (the String is the method's receiver) | unported-files row reworded to `PERMANENT:`; see Open question 2       |
| Interpolation's five `Encoding` tests (`lib/i18n/tests/interpolation.rb:78-108`: euc-jp ×2, `result.encoding` ×3), every mount | § "A String has no encoding tag either"                                                                                                                                                                                                                                  | `it.skip` + `PERMANENT-SKIP:` in `testsInterpolation()`                |
| `lookup: a resulting String is not frozen` (`lib/i18n/tests/lookup.rb`), every mount                                           | § "Ruby Strings are JS string primitives"                                                                                                                                                                                                                                | already `it.skip` (`packages/i18n/test/support/tests/lookup.ts:70-73`) |
| `default transliterator raises errors for invalid UTF-8` (`backend/transliterator_test.rb`)                                    | § "A String has no encoding tag either"                                                                                                                                                                                                                                  | existing baseline row; reword to cite the section                      |

The skipped tests count as Skip, not Miss, in `parity:test`, so "100%" here
means Miss = 0 with every Skip receipted.

### Convergeable work

Each backend mixin is a Ruby `module` included into a `Simple` subclass by
the test (`Class.new(I18n::Backend::Simple) { include I18n::Backend::Cascade }`).
Port it as a plain-object module included with `include()`, and route each
`super` through `rbCallSuper` (root CLAUDE.md § "A module included by an open
set of classes binds `super` at include time"). Application code includes
these modules, so the includers are an open set. Each story ports the lib
file and its `test/backend/*_test.rb`, and retires the lib and backend-test
unported-files rows in `scripts/parity/unported-files/i18n.ts`
and `baseline.json` in the same PR.
The `test/api/*_test.rb` mounts for cascade, memoize and pluralization are
ported, and their rows retired, by `i18n-api-tests-port-missing-api-test-files`
(RFC 0156). `api/lazy_loadable_test.rb` belongs to
`i18n-port-backend-lazy-loadable`, so that the three other suites do not wait
on Open question 4.

The gettext PoParser is racc-generated (`gettext/po_parser.rb:13-17,113`).
trails has a `Racc::Parser` runtime at `packages/nokogiri/lib/racc/parser.ts`.
Where it should live so that i18n can import it is Open question 3.

## Non-goals

- **`I18n::Backend::Cache`.** Permanent (above). There is no story to port it.
- **API fidelity of already-ported files** (RFC 0082 / 0154 stories). Test
  parity only.

## Alternatives considered

- **Re-filing the three 0156 stories here.** Rejected. Story ids are global,
  and they already carry trails#10259's context. Moving them needs
  `tasks rehome` after this RFC is ingested
  (the destination RFC must be merged and ingested first). Keeping them in 0156 as deps
  costs nothing.
- **Keeping the 19 files excluded and calling 857/857 "100%".** Rejected.
  The exclusions say "Pre-1.0" and are not ratified limits. 100% of a
  denominator that hides 150 tests is not 100% parity.

## Rollout

1. **Phase 1, mixin suites in the four existing api files** (RFC 0156):
   `i18n-api-tests-port-interpolation-and-link`,
   `i18n-api-tests-port-procs-and-localization`, then
   `i18n-api-tests-port-localization-datetime-and-time` and
   `i18n-api-tests-port-localization-procs`.
2. **Phase 2, residuals and receipts:**
   `i18n-test-rb-retire-thread-fiber-version-rows`,
   `i18n-permanent-unportable-receipts`, `i18n-port-middleware`.
3. **Phase 3, backend mixins:** `i18n-port-backend-cascade`,
   `i18n-port-backend-memoize`, `i18n-port-backend-pluralization`,
   `i18n-port-backend-lazy-loadable`, `i18n-port-backend-cache-file`.
   Then `i18n-api-tests-port-missing-api-test-files` (RFC 0156) mounts the
   cascade, memoize and pluralization api files. The lazy-loadable story mounts its own.
4. **Phase 4, gettext:** `i18n-port-gettext-helpers`, then
   `i18n-port-gettext-po-parser-and-backend`.

## Verification

- `pnpm parity:test -- --package i18n`: Miss = 0 in every row, and every Skip
  carries a `PERMANENT-SKIP:` line citing a section listed above.
- The i18n entries in `scripts/parity/unported-files/i18n.ts` are reduced to
  `backend/cache.rb`, `backend/metadata.rb`, `backend/interpolation_compiler.rb`,
  `api/all_features_test.rb`, `tests/` and `tests.rb`, each reason starting
  `PERMANENT:`. The `tests/` pair is test-support scaffolding, measured
  through `LIB_TEST_MODULES`.
- Expected denominator after Phase 3: about 857 + 5 × ~143 mounted + ~70 own tests.
  The 5 is four new api files, with `api/memoize_test.rb` counted twice because it
  defines two classes that each mount all 11 mixins.
  The exact number comes from `parity:test` once the api files exist.

## Open questions

1. **Is `port-i18n-backend-cache-file`'s `PERMANENT:` closure right?**
   `CacheFile#load_file` runs in the load step, not in the lookup, and never
   reads a cache store. Recommendation: the operator confirms the closure was
   mis-scoped, and `i18n-port-backend-cache-file` ships. If the closure
   stands, close that story `PERMANENT:` with the operator's reason.
2. **Does `InterpolationCompiler` fall under the `eval`-of-generated-Ruby
   fact?** That bullet in § "Runtime facts Node does not expose" was ruled
   for Erubi (2026-11-11). Its two `Compiler` escape tests
   (`test/backend/interpolation_compiler_test.rb:14-32`) assert only on
   generated Ruby source text. Recommendation: the operator extends the
   bullet to `InterpolationCompiler`, since a JS closure in place of the
   Ruby source would be an invented mechanism. Until that ruling,
   `i18n-permanent-unportable-receipts` leaves this row unchanged.
3. **Where does the racc runtime live?** Options: (a) i18n depends on
   `@blazetrails/nokogiri` for `lib/racc/parser.ts`; (b) move it to a
   `@blazetrails/racc` package mirroring the racc gem (`vendor/racc`, already
   fetched); (c) move it to ruby-compat. Recommendation: (b). racc is a
   separate gem in Ruby, and nokogiri and i18n both depend on it. Decide
   before `i18n-port-gettext-po-parser-and-backend`.
4. **`LazyLoadable` loads inside the lookup.** `lookup` calls
   `init_translations` for the current locale (`backend/lazy_loadable.rb:107-127`).
   That is the I/O-in-the-walk shape the i18n CLAUDE.md section rules out,
   the same reasoning that makes `Backend::Cache` permanent. Recommendation:
   the operator rules the lookup-time-load arms permanent under that section.
   Port the rest (eager mode, `available_locales`, the filename and
   locale-mismatch errors) through the awaited `reloadBang` /
   `eagerLoadBang`, and park the lookup-time tests as `it.skip` under `PERMANENT-SKIP:`. Do not invent a sync
   file read or a load in `locale=`. The lookup-time tests are:
   - "lazy mode: only loads translations for current locale"
   - "lazy mode: #lookup lazy loads translations for supplied locale"
   - "lazy mode: #initialized? responds based on whether current locale is
     initialized"

   This affects `backend/lazy_loadable_test.rb` only. `api/lazy_loadable_test.rb`
   runs in eager mode (`LazyLoadable.new`, default `lazy_load: false`), so its
   mounted suites port in full whatever the ruling.

## Changelog

- 2026-11-17: initial RFC
- 2026-11-17: review fixes. The 0156 ACs are rewritten in place, api-mount ownership is made explicit, and `api/lazy_loadable_test.rb` moves to the lazy-loadable story because it runs in eager mode.
