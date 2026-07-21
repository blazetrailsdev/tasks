---
title: "test-deps extractor: namespaced fixture declarations never intersect dereferences"
status: done
updated: 2026-07-21
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5034
claim: "2026-07-21T18:25:22Z"
assignee: "test-deps-namespaced-fixture-name-normalization"
blocked-by: null
closed-reason: null
---

## Context

Found while fixing the `expected-fixtures` snake/camel comparison bug in #5011.

`scripts/test-deps/rails-test-deps.ts` records a test class's **declared**
fixture sets and its **dereferenced** ones under different naming schemes for
namespaced fixtures:

- declared (from `fixtures :"admin/accounts"`) → `"admin/accounts"`
- dereferenced (from `admin_accounts(:david)`) → `"admin_accounts"`

`requiredFixtureSets` (eslint/expected-fixtures.mjs) intersects the two, so
namespaced sets **never** intersect and are silently filtered out. The rule
therefore no-ops on every namespaced fixture set. Confirmed on
`fixtures_test.rb`, `filter_attributes_test.rb`, `store_test.rb`: all declare
`admin/*` sets, all report `REQUIRED: []`, and
`referenced accessors containing admin` is empty even though Rails'
`fixtures_test.rb` does dereference `admin_accounts(...)`.

Second, smaller bug in the same extractor: `fixtures_test.rb` emits a fixture
named `"/categories_ordered"` with a **leading slash** — a parse artifact
(likely a multi-line `fixtures` declaration or a `:"..."` symbol split).

PR #5011 confirmed `camelize` already produces the correct trails-side keys for
namespaced sets (`admin/randomly_named_a9` → `admin/randomlyNamedA9`, matching
`fixtures-registry.ts:127` verbatim) and pinned that with a test — so once the
extractor intersects correctly, the rule side is already ready.

## Acceptance criteria

- The extractor normalizes declared and dereferenced namespaced fixture names
  to the same key, so `admin/accounts` declared + `admin_accounts(:david)`
  dereferenced intersect in `requiredFixtureSets`.
- `"/categories_ordered"` no longer appears; the leading-slash parse artifact
  is fixed (or the real name it came from is emitted).
- `pnpm tsx scripts/test-deps/build-fixture-baseline.ts` regenerates cleanly;
  any files that become newly-enforced are either fixed or added to the
  exclude baseline by regeneration (never hand-trimmed).
- Existing namespaced-camelize test in `eslint/expected-fixtures.test.mjs`
  still passes.

## Verification

`pnpm lint`, `pnpm vitest run eslint/expected-fixtures.test.mjs`, and a diff
of the regenerated exclude baseline.
