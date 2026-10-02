---
title: "Enroll actioncable in parity:api / parity:test and in every parity gate at zero"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "scripts"]
deps:
  [
    "actioncable-package-skeleton",
    "ci-actioncable-only-diffs-scope-rails-comparison-to-actioncable",
  ]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Today `pnpm parity:api --package actioncable` fails with `unknown package`:
`vendor/sources.ts` has no actioncable entry under the `rails` source.
Measured over the vendored tree with the unmodified extractors:

```text
actioncable: 38 classes, 35 modules, 358 public methods (89 internal)   (42 files)
actioncable: 30 files, 171 tests
```

The test extractor does not see the nine shared cases in
`vendor/rails/v8.0.2/actioncable/test/subscription_adapter/common.rb` and `channel_prefix.rb`: they are
`def test_*` methods in modules that four test classes include.

**The RFC's parity plan is "zero from the first PR".** This story enrols the
package in every gate while it has three files, so no baseline row, mark or
allowlist entry is ever created for it and none has to be burnt down later.

Registrations:

1. `vendor/sources.ts`: `{ name: "actioncable", libPath:
"actioncable/lib/action_cable", testPath: "actioncable/test" }`, plus
   `vendor/sources.test.ts`, which asserts the exact key lists.
2. `MANIFEST_PACKAGES` in `scripts/api-compare/config.ts`.
3. `scripts/test-compare/extract-ts-tests.ts` (`getPackageTestFiles()`),
   `scripts/test-compare/compare.ts` `pkgDirs`, and
   `scripts/test-compare/generate-stubs.ts`.
4. A sorted, hand-added `0/0/0` row in
   `scripts/test-compare/assertion-mismatch-mark.json`. Do not reseed.
5. `eslint.config.mjs` and `eslint/rails-private-jsdoc.config.mjs`:
   `packages/actioncable/src/**/*.ts` in the `rails-private-jsdoc` block
   **and** the `unbacked-internal-needs-receipt` block of both files, with
   the root config's `ignores` mirrored into the second.
6. Extra surface: `actioncable` in `ROWLESS_PACKAGES`
   (`scripts/api-compare/extra-surface-mark.ts:138`), with no row in
   `extra-surface-mark.json`.
7. `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts:32` and
   `arm-throw-mark.ts:56`, and the block-param, predicate-kind and
   ambiguous-parent marks (`scripts/api-compare/*-mark.json`), each at 0.
8. `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:106`).
9. `blazetrails/rails-file-structure-method-order` for the package.
10. No `call-mismatches-exclude/actioncable/` shard and no
    `arity-exclude.json` row.

**Non-ports and skips**, recorded here so no later story invents a register:

- `scripts/parity/unported-files/actioncable.ts`
  (`ACTIONCABLE_UNPORTED_FILES`, spread into `index.ts`): a `testFile`
  entry for `javascript_package_test.rb` (it runs `yarn build` over Rails'
  own JS sources). `vendor/rails/v8.0.2/actioncable/test/javascript/**` and `app/**` are not `.rb`
  and are outside both extractors.
- `SCOPED_SKIP_GROUPS` in `scripts/parity/conventions.ts`:
  `StreamEventLoop#spawn`, `#run` and `#wakeup`, with a reason citing the
  CLAUDE.md section from
  `ratify-node-event-loop-stands-in-for-the-nio4r-selector`. That story
  decides whether `writes_pending` and `Stream#flush_write_buffer` join
  them; add those two there, not here.
- `lib/rails/generators/**` is outside `libPath`, as every framework
  generator is today; `railties/test/generators/channel_generator_test.rb`
  is in trailties' population.
- `engine.rb` is ported at `packages/trailties/src/trailties/action-cable.ts`,
  beside `active-record.ts` and `global-id.ts`. Record the path override
  the way `global_id/railtie.rb` is recorded, in `RUBY_FILE_TS_OVERRIDES`
  or the equivalent the conventions doc names.

Check `rubyToConventionTs` maps `connection/base_test.rb` →
`connection/base.test.ts`, `worker_test.rb` → `worker.test.ts` and
`subscription_adapter/postgresql_test.rb` →
`subscription-adapter/postgresql.test.ts` before adding a package arm.

## Fidelity traps (predicted at authoring)

- [ ] **`pnpm parity:test` passes without the assertion-mark row.** The ratchet is a separate script; a green local compare proves nothing.
- [ ] **A `ROWLESS_PACKAGES` member with a mark row fails the gate.** Add the package to the list and add no row.
- [ ] **The `unbacked-internal` enrollment list is only-grow** and must match in both eslint files.
- [ ] **Shared test modules.** `common.rb` and `channel_prefix.rb` are included into `async_test`, `inline_test`, `postgresql_test` and `redis_test`. Decide here how `parity:test` credits a case defined in an included module, and record it, so the four stories that port those files do not each decide.
- [ ] **`PostgreSQL` inflection.** Zeitwerk is told `"postgresql" => "PostgreSQL"` (`lib/action_cable.rb:49`); the file is `postgresql.rb` and the class is `PostgreSQL`. Check the api-compare pairing finds it.

## Acceptance criteria

- [ ] `pnpm parity:api --package actioncable` and `pnpm parity:test` print an actioncable row.
- [ ] Every gate in the list runs for actioncable and is green at zero: `parity:api:calls`, `parity:api:calls:args`, `parity:api:params`, `parity:api:predicates`, `parity:api:extra:gate`, `parity:api:arms:throws`, `parity:api:blocks`, `parity:api:parents`, `parity:test:assertions`.
- [ ] No baseline row, exclude shard or non-zero mark exists for actioncable.
- [ ] `unported-files/actioncable.ts` and the `SCOPED_SKIP_GROUPS` entry exist with reasons.
- [ ] The scoped comparison job from `ci-actioncable-only-diffs-scope-rails-comparison-to-actioncable` is proven end to end: on a scratch branch, an actioncable-only diff that deletes a ported method, and one that adds an extra public name, each red it. The result is recorded in the PR body.
- [ ] `parity:api` / `parity:test` deltas for every other package are non-negative.

## Definition of done

A mark seeded above zero "to tighten later", or a gate left for a follow-up story, does not close this story.

## Verification

```bash
# on a scratch branch: delete a ported method and add an extra public name under packages/actioncable; the scoped comparison job must go red
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable
pnpm parity:test && pnpm parity:test:assertions
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:parents
pnpm vitest run vendor/sources.test.ts scripts
pnpm lint
```
