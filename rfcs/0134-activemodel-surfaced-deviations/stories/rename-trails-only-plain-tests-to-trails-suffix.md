---
title: "activemodel: 13 trails-authored plain .test.ts files should carry the .trails.test.ts suffix"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: test-placement
packages: ["activemodel"]
deps: ["test-compare-lint-and-serializers-json-mapping"]
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

15 activemodel test files map to no Rails test file yet use the plain
`.test.ts` suffix. Two are mapping bugs handled by the
`test-compare-lint-and-serializers-json-mapping` story (`lint.test.ts`,
`serializers/json.test.ts`). The other 13 are genuinely trails-authored suites
of ported internals and belong under the trails-only convention
(`*.trails.test.ts`):

`attribute-mutation-tracker.test.ts`, `attribute-set/builder.test.ts`,
`attribute-set/builder-defaults.test.ts`, `attribute-set/codecs/json.test.ts`,
`attribute-set/codecs/yaml.test.ts`, `attribute-set/yaml-encoder.test.ts`,
`attribute/user-provided-default.test.ts`, `dirty-generated-methods.test.ts`,
`dirty-mutations.test.ts`, `type/helpers/accepts-multiparameter-time-defaults.test.ts`,
`type/helpers/mutable.test.ts`, `type/helpers/numeric.test.ts`,
`type/helpers/time-value.test.ts`.

File renames only — test NAMES must not change (they are how `parity:test`
matches, and these being unmapped does not exempt them from the rule). Check
the vitest include globs still collect the renamed files (the
`sibling_pr_can_narrow_your_vitest_glob` class of miss — an uncollected test
looks green).

## Acceptance criteria

- The 13 files renamed to `.trails.test.ts`; zero test-name edits
  (`git diff` shows pure renames).
- `pnpm parity:test` deltas non-negative; a spot-check vitest run on 2-3
  renamed files confirms they are still collected.

## Note

This is a mechanical rename — the one sanctioned single-mechanical-rename PR
shape; note it in the PR body.
