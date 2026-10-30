---
rfc: "0000-trailties-port"
title: "Port the rest of railties into trailties, and its test suite"
status: draft
created: 2026-10-30
updated: 2026-10-30
owner: "@deanmarano"
packages:
  - trailties
  - activesupport
  - actionmailer
clusters:
  - tt-harness
  - tt-layout
  - tt-surface
  - tt-tests
related-rfcs:
  - "0171-thor-port"
  - "0142-trailties-surfaced-deviations"
  - "0104-twitter-app-full-stack-integration"
  - "0204-actionmailer-and-mail-port"
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Port the rest of railties into trailties, and its test suite

## Summary

Every other Rails framework has a package-port or parity RFC; railties has only
its deviation bucket (RFC 0142) and the Thor convergence (RFC 0171). This RFC
is the coverage campaign for `vendor/rails/v8.0.2/railties`. It ports the lib
surface that has no TS counterpart yet, and it builds the two test harnesses
that railties' suite is written against: `test/isolation/abstract_unit.rb` and
`Rails::Generators::TestCase`. Without those harnesses roughly 2,000 of the
2,419 Rails tests cannot be ported at all.

## Motivation

trailties is a substantial package already (202 source files), but parity
measures it as half-ported. Local runs on 2026-10-30, measured against a stale
build (`API_COMPARE_ALLOW_STALE_BUILD=1`), so the numbers are indicative only:

- `parity:api --package trailties`: **913/1678 methods (54.4%)**, files 91/134,
  inheritance 43/77.
- `parity:test --package trailties`: **252/2419 tests (10.4%)**, 36/152 files,
  144 misplaced, 161 TS-only.

Where the missing API surface is:

| Area                                               | Missing | Notes                                                                                                  |
| -------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `generators/rails/**` (app, plugin, db, …)         | 195     | `app_generator.rb` scored 0/96: the port sits at the wrong path                                        |
| top-level `lib/rails/*.rb`                         | 102     | `application.rb` 16, `engine.rb` 10, `paths.rb` 10, `mailers_controller.rb` 12, `code_statistics.rb` 9 |
| `generators/app_base.rb`                           | 72      | 23/95                                                                                                  |
| `test_unit/**`                                     | 67      | runner, reporter, test_parser, line_filtering: no files                                                |
| `commands/**`                                      | ~140    | owned by RFC 0171's `port-*-onto-rails-command-base` stories                                           |
| `generators/testing/**`, `generators/test_case.rb` | 40      | the generator test harness                                                                             |
| `api/**`                                           | 15      | RDoc API-doc generator, a non-goal                                                                     |

Where the Rails tests are (`test` / `def test_` blocks):

| `railties/test/` | Rails tests | Harness it needs                       |
| ---------------- | ----------- | -------------------------------------- |
| `application/`   | 1,203       | `isolation/abstract_unit.rb`           |
| `generators/`    | 777         | `Rails::Generators::TestCase`          |
| `commands/`      | 221         | isolation (RFC 0171 owns the commands) |
| top-level        | 158         | plain                                  |
| `railties/`      | 92          | isolation                              |
| everything else  | 81          | mixed                                  |

58 of the `application/` files include `ActiveSupport::Testing::Isolation`.
`trailties` ships no isolation harness, which is why
`isolation-test-app-builder-strips-eslint-autocorrect-line` (RFC 0142) has
nothing to converge onto.

## Design

### Scope split with RFC 0171 and RFC 0142

- **RFC 0171** owns every `commands/**/*_command.rb` port, the
  generator-onto-Thor conversions, and `trails new` dispatch. This RFC files no
  command stories except `rails plugin new` (`commands/plugin/plugin_command.rb`),
  which 0171 does not cover and which only makes sense next to the plugin
  generator.
- **RFC 0142** keeps every deviation found in code that is already ported. A
  story here ports what is missing. It does not re-file a 0142 story.
- **This RFC** owns the unported lib files, the two test harnesses, file
  relocation onto the Rails paths, and porting the test suite.

### The isolation harness

`test/isolation/abstract_unit.rb` (651 lines) is a test-support file, not lib.
It ports to `packages/trailties/src/test-helpers/isolation/abstract-unit.ts`,
mirroring its modules: `TestHelpers::Paths`, `Rack`, `Generation`,
`Reload`, `Bundler`.

- **The app template.** Rails runs `rails new tmp/app_template --skip-bundle`
  once per run (`abstract_unit.rb:618-630`) and copies it per test in
  `build_app` (`:107-153`). The port runs `trails new` once, in vitest
  `globalSetup`, and keeps the copy per test. Rails' edits to the template
  (rewriting `config/boot.rb`, faking `Bundler.require`) become the
  matching edits to the generated TS files.
- **Isolation per test.** `ActiveSupport::Testing::Isolation` runs each test in
  a fork (`Forking`, `activesupport/lib/active_support/testing/isolation.rb:35`),
  or in a re-exec'd subprocess where fork is unavailable (`Subprocess`, `:73-115`,
  keyed by `ISOLATION_TEST`). CLAUDE.md § "Runtime facts Node does not expose"
  rules `fork` out. So the port is Rails' own **`Subprocess` arm**, ported into
  activesupport: the test re-runs itself in a child vitest process filtered to
  that one test, and the parent reads the marshalled result back. This is a
  branch Rails already has, so it adds no new shape.
- **`rails(*args)`** (`:345-385`) shells out to `bin/rails` in the app. Its
  fork arm is unportable for the same reason, and the `NO_FORK` arm (a plain
  child process) is the one that gets ported.

### The generator harness

`Rails::Generators::TestCase` (`generators/test_case.rb`) with `Testing::Behavior`,
`SetupAndTeardown` and `Assertions` (`generators/testing/*.rb`) ports at its
Rails paths. `assertions.rb` is already 12/12. `behavior.rb` (4/34) carries
`run_generator`, `generator`, `prepare_destination` and `destination`. The
generator tests then port onto it rather than onto the ad-hoc helpers the
current `generators/*.test.ts` files use.

### File layout

`parity:api` scores `generators/rails/app/app_generator.rb` 0/96 because the
port lives at `generators/app-generator.ts`, and `parity:test` reports 144
misplaced test files. Files move to the paths
`docs/ruby-ts-conventions.md` produces, with no body changes in the same PR,
so the parity deltas from relocation are easy to tell apart from porting work.

### `test_unit/` and `rails test`

`Rails::TestUnit::Runner`, `Reporter` and `TestParser` drive Minitest. trails'
tests run on Vitest, and Minitest is becoming its own package
(`@blazetrails/minitest`). Whether the runner ports over that package, or
`rails test` drives Vitest, is open question 1. The stories are filed as
`draft` until it is answered.

## Non-goals

- **`api/**`** (`RDoc::Generator::API`, `api/task.rb`): it builds Rails' own
  RDoc site and has no meaning for a TS package. Its files become permanent
  unported rows.
- **`autoloaders.rb`, `autoloaders/**`, `zeitwerk_checker.rb`\*\*: CLAUDE.md
  § "Trails has no autoloader" (packages/trailties/CLAUDE.md) rules these out.
- **Commands other than `plugin`**: RFC 0171.
- **Bundler-specific arms** of `app_base.rb` and the generators
  (`bundle_command`, `run_bundle`, gemfile entries): RFC 0171's
  `converge-generators-actions-gemfile-family-onto-package-json` decides their
  package.json counterpart.
- **ActionMailbox and ActionText** railties pieces (`rails/all.rb` requires,
  their generator hooks): no package exists for them.

## Alternatives considered

- **Fold this into RFC 0142.** Rejected. 0142 is a deviation bucket with no
  campaign by design, and mixing porting work into it hides both.
- **Run isolation tests in-process, resetting `Rails.application` between
  tests.** Rejected. Rails resets nothing between isolation tests, because each
  one gets a fresh process. A reset would be invented machinery, and it would
  miss every module-level registry (see
  `reset-trailtie-registry-between-tests`, RFC 0104).
- **Use one vitest file per isolated test.** Rejected. It breaks
  `parity:test`'s one-file-per-Rails-file mapping.

## Rollout

1. Harness: `activesupport-testing-isolation-subprocess`,
   `trailties-isolation-abstract-unit-generation`,
   `trailties-isolation-abstract-unit-boot-and-rails-command`,
   `trailties-generators-test-case-and-behavior`
2. Layout: `trailties-relocate-app-generator-to-rails-path`,
   `trailties-relocate-misplaced-test-files`
3. Surface: `trailties-app-base-remaining-surface`,
   `trailties-plugin-generator-part-1`,
   `trailties-plugin-generator-part-2-and-plugin-command`,
   `trailties-application-engine-and-paths-remaining-surface`,
   `trailties-code-statistics-info-and-annotations-remaining-surface`,
   `trailties-mailers-controller`,
   `trailties-test-unit-test-parser-and-line-filtering`,
   `trailties-test-unit-runner-reporter-and-test-command`
4. Tests: `trailties-port-application-initializers-tests` and
   `trailties-port-generator-tests-onto-generators-test-case` are pilots. Each
   sizes its directory. The remaining test-file stories are filed from the
   pilots' measured LOC per Rails test, rather than guessed now.

Phases 2 and 3 do not depend on phase 1 and can run in parallel with it.

## Verification

- `parity:api --package trailties` reaches 100% of the in-scope surface, with
  `api/**`, the autoloader files and the Bundler arms recorded as permanent
  unported rows that cite this RFC's non-goals.
- `parity:test --package trailties` reports 0 misplaced files. Every ported
  `application/` and `generators/` test runs on the ported harness, and every
  skip is a `PERMANENT-SKIP` that cites a ruling.
- The call, argument, parameter-name and extra-surface gates are green for
  the package.

## Open questions

1. **What does `rails test` drive?** (a) Port `Rails::TestUnit::Runner` over
   `@blazetrails/minitest`, line for line. (b) Keep Rails' names and argument
   parsing (`TestParser`, `line_filtering`, `-n`, `file:line`) and hand off to
   Vitest. Recommendation: (b). `LineFiltering` ports unchanged. `TestParser` is a
   `Ripper` subclass (`test_unit/test_parser.rb:57`) that finds each test's
   line range in Ruby source. Its port reads TS test files through the
   compiler API, a language-forced deviation that keeps Rails' names.
   `Runner#run` then execs Vitest with a name filter. The tests that assert on Minitest's own
   reporter output (`test_unit/reporter_test.rb`, 17 tests) then wait on
   whichever package owns the Minitest reporter.
2. **Where the isolation `Subprocess` arm lives.** Recommendation: in
   activesupport (`testing/isolation.ts`), at Rails' path, since the
   `application/` tests are not its only includers.
3. **Generator tests that snapshot output.** The current
   `generators/__snapshots__` have no Rails counterpart, since Rails asserts
   with `assert_file`. Recommendation: the generator-test pilot replaces them
   with `assert_file` / `assert_match` as Rails writes them, and deletes the
   snapshots.

## Changelog

- 2026-10-30: initial draft
