---
rfc: "0248-trailties-parity-100"
title: "trailties: 100% API and test parity"
status: draft
created: 2026-11-18
updated: 2026-11-18
owner: "@deanmarano"
packages:
  - trailties
  - scripts
clusters:
  - test-ports
  - test-structure
  - api-residuals
  - receipts
related-rfcs:
  - "0212-trailties-port"
  - "0142-trailties-surfaced-deviations"
  - "0171-thor-port"
  - "0246-activesupport-parity-100"
priority: 2
---

# RFC 0248 — trailties: 100% API and test parity

## Summary

Bring `packages/trailties` to 100% on both `pnpm parity:api` and
`pnpm parity:test`. Every railties public method needs a matched trails
member and every railties test a name-matched trails test, except where a
ratified CLAUDE.md section makes a gap permanent and the row carries that
receipt. Today trailties is at **93.9% API (1667/1775)** and **28.6% tests
(691/2417)**.

RFC 0212 (closed) ported the lib surface and built both test harnesses
(`test/support/isolation/abstract-unit.ts` and the `Generators::TestCase`
port). What is left is mostly porting tests onto those harnesses.

## Motivation

Measured on 2026-11-18 at trails `438f855488`, after a clean `pnpm build`,
in a fresh worktree:

```text
pnpm parity:test -- --package trailties
trailties — 691/2417 tests (28.6%) (42 skipped, 16 wrong describe,
  187 extra (TS only)) | 74/152 files | 120 misplaced

pnpm parity:api -- --package trailties --missing --arity --inheritance
trailties — 1667/1775 methods (93.9%) | files: 136/146
  | inheritance: 110/118 (93.2%) | arity: 732/738 (99.2%) | params: 377/377
  Ruby defs: 1698 — own row 1576 | excluded file 0 | rowless file 0
  | global skip 20 | scoped skip 19 | operator 8 | same-name collapse 75
```

### Test gap

1,564 Miss across 109 files, 120 misplaced, 16 wrong describe, 42 skips. The
largest files:

| Rails test file                                                       | Miss | Stories                                                |
| --------------------------------------------------------------------- | ---: | ------------------------------------------------------ |
| `application/configuration_test.rb`                                   |  349 | `trailties-test-application-configuration-part-{1..8}` |
| `generators/app_generator_test.rb`                                    |  111 | `trailties-test-app-generator-part-{1..3}`             |
| `application/test_runner_test.rb`                                     |   84 | `trailties-test-application-test-runner-part-{1,2}`    |
| `application/rake/multi_dbs_test.rb`                                  |   65 | `trailties-test-rake-multi-dbs-part-{1,2}`             |
| `generators/plugin_generator_test.rb`                                 |   49 | `trailties-test-plugin-generator`                      |
| `application/rake/dbs_test.rb`                                        |   49 | `trailties-test-rake-dbs`                              |
| `railties/engine_test.rb`                                             |   47 | `trailties-test-railties-engine`                       |
| `generators/generated_attribute_test.rb`                              |   44 | `trailties-test-generated-attribute`                   |
| `generators/actions_test.rb`                                          |   42 | `trailties-test-generator-actions`                     |
| `commands/middleware_test.rb`                                         |   38 | `trailties-test-commands-middleware`                   |
| `application/sprockets_assets_test.rb` + `assets` + `asset_debugging` |   58 | `trailties-test-asset-pipeline-permanence`             |

Every other Miss file is listed in exactly one story's Context table, and
those tables sum to the 1,564. The split stories name a Rails line range
(`file.rb:a-b`), and the boundaries were picked from `parity:test --missing` so
each range holds about 44 (configuration) or 37 (app generator) Miss. The one
overlap is `generators_test.rb`'s `source paths for not namespaced generators`,
which is counted in `trailties-test-generators-lookup` but owned by the moved
story `port-source-paths-for-not-namespaced-generators-test`.

### API gap: 108 missing members

| Area                                                        | Miss | Story                                    |
| ----------------------------------------------------------- | ---: | ---------------------------------------- |
| `generators/app_base.rb` + plugin generator Gemfile entries |   28 | `trailties-api-app-base-gemfile-entries` |
| other generator modules                                     |   35 | `trailties-api-generators-residue`       |
| `commands/*` `perform` / constructors                       |   21 | `trailties-api-commands-perform-surface` |
| `api/generator.rb`, `api/task.rb` (✗)                       |   15 | `trailties-api-rdoc-task-permanence`     |
| railtie, configurable, engine, application                  |    9 | `trailties-api-railtie-engine-residue`   |

Inheritance (8) and arity (6) belong to
`trailties-api-structure-inheritance-arity`; the 39 skip rows to
`trailties-api-skip-receipts-audit`.

## Stories moved in

From RFC 0142, by `git mv` with a rewritten `rfc:` line (what `tasks rehome`
does), because each closes test rows:

| Story                                                  | Closes                             |
| ------------------------------------------------------ | ---------------------------------- |
| `port-source-paths-for-not-namespaced-generators-test` | 1 `generators_test.rb` Miss        |
| `port-plugin-helpers-with-new-plugin`                  | 2 scaffold-controller engine tests |
| `scaffold-generator-engine-subprocess-tests`           | 7 scaffold engine tests            |

The rest of 0142 is fidelity work that does not move a parity number and stays
there.

## Design

### What "100%" means

- `parity:test`: Miss, Desc and Move are 0, no file is ✗, and every Skip has a
  `PERMANENT-SKIP:` line citing a CLAUDE.md section by name.
- `parity:api`: Miss is 0, inheritance and arity at 100%. A row the tool
  cannot match for a ratified reason is receipted `PERMANENT:`.
- Every trailties scoped/global skip reason starts with `PERMANENT:`.

`trailties-parity-100-gate` enforces all three in CI.

### Story sizing

Each story is one trails PR under 500 LOC. Big files are split by Rails line
range so two agents never edit the same tests. When a ported test fails, the
fix goes into `packages/trailties/lib`; if that fix is too big, the agent
files it with `pnpm tasks new 0248 <slug>` and blocks on it. Tests are never
renamed or skipped to pass.

### Permanence candidates

| Gap                                                   | Section                                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `sprockets_assets`, `assets`, `asset_debugging` tests | "importmap-rails and propshaft are out of scope; JavaScript is served by Vite" (Sprockets: Open question 1) |
| `TestUnitReporter` superclass                         | trailties CLAUDE.md "`TestUnitReporter` has no `Minitest::StatisticsReporter` superclass"                   |
| `api/generator.rb`, `api/task.rb`                     | none yet: Open question 2                                                                                   |

## Non-goals

- Fidelity bugs that do not move a parity number (RFC 0142).
- The 187 extra TS-only tests.
- Thor itself (RFC 0171).

## Alternatives considered

- **Add more stories to RFC 0142 instead of a new RFC.** Rejected. 0142 is a
  bucket for deviations. It has no definition of done, and its ~110 open
  stories do not move a parity number.
- **Reopen RFC 0212.** Rejected. Closed RFCs cannot be reopened
  (`rfc-status`), and 0212's job was the harnesses and lib surface, which are
  done.
- **One story per Rails test file.** Rejected for the four files with more
  than 60 Miss. Each would be well over the 500 LOC ceiling, so they are split
  by line range, with the boundaries chosen so each range has about the same
  Miss count.

## Rollout

1. `trailties-test-move-misplaced-tests` first (several test stories depend on it).
2. Test ports in parallel; the configuration and app-generator splits can run concurrently.
3. API residue, structure, receipts.
4. `trailties-test-wrong-describe-and-skip-receipts`, then `trailties-parity-100-gate`.

## Verification

- `pnpm parity:test -- --package trailties` and
  `pnpm parity:api -- --package trailties --missing --arity --inheritance` on a
  clean build meet the definition above.
- The gate's CI check passes on main.

## Open questions

1. **Is Sprockets out of scope like Propshaft?** Recommendation: yes; extend the
   root section to name Sprockets, so the 58 asset tests are receipted except
   those that test Vite-reachable behavior.
2. **Do `api/generator.rb` and `api/task.rb` count?** They build Rails' own
   API docs. Recommendation: receipt them `PERMANENT:` under a new section for
   "Rails-repo maintenance tooling".
3. **Do the `configuration_test.rb` line splits hold?** Ranges are even by
   line, not by test; an agent that finds its range unbalanced says so in its PR
   rather than taking tests from a neighbor's range. (Measured counts per range are
   recorded in each story, so this should be rare.)

## Stories

| Story                                                   | Cluster        | est-loc |
| ------------------------------------------------------- | -------------- | ------: |
| `trailties-test-application-configuration-part-1`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-2`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-3`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-4`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-5`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-6`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-7`       | test-ports     |     480 |
| `trailties-test-application-configuration-part-8`       | test-ports     |     480 |
| `trailties-test-app-generator-part-1`                   | test-ports     |     450 |
| `trailties-test-app-generator-part-2`                   | test-ports     |     450 |
| `trailties-test-app-generator-part-3`                   | test-ports     |     450 |
| `trailties-test-application-test-runner-part-1`         | test-ports     |     480 |
| `trailties-test-application-test-runner-part-2`         | test-ports     |     480 |
| `trailties-test-rake-multi-dbs-part-1`                  | test-ports     |     450 |
| `trailties-test-rake-multi-dbs-part-2`                  | test-ports     |     450 |
| `trailties-test-rake-dbs`                               | test-ports     |     480 |
| `trailties-test-rake-migrations-and-tasks`              | test-ports     |     480 |
| `trailties-test-plugin-generator`                       | test-ports     |     480 |
| `trailties-test-railties-engine`                        | test-ports     |     480 |
| `trailties-test-railtie-and-engine-small-files`         | test-ports     |     400 |
| `trailties-test-generated-attribute`                    | test-ports     |     350 |
| `trailties-test-generator-actions`                      | test-ports     |     400 |
| `trailties-test-commands-middleware`                    | test-ports     |     350 |
| `trailties-test-application-routing`                    | test-ports     |     450 |
| `trailties-test-paths`                                  | test-ports     |     300 |
| `trailties-test-server-and-rackup`                      | test-ports     |     400 |
| `trailties-test-credentials-and-encrypted`              | test-ports     |     400 |
| `trailties-test-generators-lookup`                      | test-ports     |     450 |
| `trailties-test-devcontainer`                           | test-ports     |     350 |
| `trailties-test-zeitwerk-and-loading`                   | test-ports     |     480 |
| `trailties-test-runner`                                 | test-ports     |     350 |
| `trailties-test-console-and-dbconsole`                  | test-ports     |     350 |
| `trailties-test-query-logs`                             | test-ports     |     300 |
| `trailties-test-middleware-exceptions-and-session`      | test-ports     |     400 |
| `trailties-test-middleware-cache-cookies-static-logger` | test-ports     |     350 |
| `trailties-test-named-base-and-create-migration`        | test-ports     |     300 |
| `trailties-test-multiple-applications`                  | test-ports     |     250 |
| `trailties-test-test-runner-plugin-and-parser`          | test-ports     |     450 |
| `trailties-test-install-generators`                     | test-ports     |     300 |
| `trailties-test-commands-routes-and-help`               | test-ports     |     400 |
| `trailties-test-commands-small-files`                   | test-ports     |     250 |
| `trailties-test-security-policies`                      | test-ports     |     300 |
| `trailties-test-application-singletons`                 | test-ports     |     480 |
| `trailties-test-asset-pipeline-permanence`              | receipts       |     200 |
| `trailties-test-move-misplaced-tests`                   | test-structure |     450 |
| `trailties-test-wrong-describe-and-skip-receipts`       | receipts       |     350 |
| `trailties-api-commands-perform-surface`                | api-residuals  |     120 |
| `trailties-api-app-base-gemfile-entries`                | api-residuals  |     400 |
| `trailties-api-generators-residue`                      | api-residuals  |     400 |
| `trailties-api-railtie-engine-residue`                  | api-residuals  |     200 |
| `trailties-api-rdoc-task-permanence`                    | receipts       |     150 |
| `trailties-api-structure-inheritance-arity`             | api-residuals  |     300 |
| `trailties-api-skip-receipts-audit`                     | receipts       |     150 |
| `trailties-parity-100-gate`                             | receipts       |     150 |
| `port-source-paths-for-not-namespaced-generators-test`  | moved          |       — |
| `port-plugin-helpers-with-new-plugin`                   | moved          |       — |
| `scaffold-generator-engine-subprocess-tests`            | moved          |       — |

## Changelog

- 2026-11-18: initial RFC
- 2026-11-18: self-review. The split ranges are re-cut from measured Miss
  counts, the split-story AC is per range, the wrong-describe breakdown is
  corrected (16), Alternatives is added, and the moved stories now depend on
  the misplaced-test move.
