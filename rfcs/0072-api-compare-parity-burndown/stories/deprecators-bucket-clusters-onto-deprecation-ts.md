---
title: "deprecators-bucket-clusters-onto-deprecation-ts"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6240
claim: "2026-08-08T15:27:57Z"
assignee: "deprecators-bucket-clusters-onto-deprecation-ts"
blocked-by: null
closed-reason: null
---

## Context

`selectMisplacedFile` (`scripts/api-compare/compare.ts`) no longer resolves a
bucket onto the package barrel (PR for
`misplaced-file-cluster-must-not-resolve-onto-package-barrel`). Dropping the
barrel from the vote let two buckets find their next-strongest cluster, and one
of them is a false pairing of the same species, just onto a real file rather
than the barrel:

- `activesupport:deprecation/deprecators.rb` now clusters onto
  `activesupport/src/deprecation.ts`, scoring 6/10. trails has no `Deprecators`
  class at all (`grep -rn "class Deprecators" packages/activesupport/src` is
  empty; the only mention is `railtie.ts:27`, a comment). The hits are
  `Deprecation`'s own `silenced=` / `behavior=` / `disallowed_behavior=` /
  `disallowed_warnings=` / `silence` setters, whose names coincide with
  `Deprecators`' delegating setters
  (`vendor/rails/activesupport/lib/active_support/deprecation/deprecators.rb:19-49`).
  So a bucket with zero port reads as 60% ported.

The sibling case, `testing/error_reporter_assertions.rb ↦ error-reporter.ts`,
was settled in that PR with an `UNPORTED_FILES` entry — it is a Minitest
assertion module with no trails counterpart. `deprecators.rb` is different: it
is app-facing API trails simply has not ported, so it should read as _missing_,
not _unported_.

## Acceptance criteria

- [ ] `deprecation/deprecators.rb` no longer takes credit from `deprecation.ts`
      — either a name-collision guard in the cluster vote (a bucket whose Ruby
      class has no same-named TS entity anywhere is not clustered), or an
      explicit registration that keeps it at 0/10 and visible as a gap.
- [ ] The barrel exclusion and the `error_reporter_assertions.rb` entry stay
      unchanged.
- [ ] `pnpm parity:api:calls` green; `pnpm parity:api` delta non-negative.
- [ ] Unit test alongside the existing `selectMisplacedFile` cases in
      `scripts/api-compare/compare.test.ts`.
