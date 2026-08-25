---
title: "no-internal-canonical-loaders' module matcher is a hardcoded basename list"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5657
claim: "2026-07-30T18:29:18Z"
assignee: "canonical-loader-ban-module-matcher-is-hardcoded"
blocked-by: null
closed-reason: null
---

## Context

`eslint/no-internal-canonical-loaders.mjs` decides whether an import is "the
canonical loader module" with a hardcoded basename alternation:

```js
return /(?:^|\/)(?:canonical-schema|canonical-table-rebuild|load-schema-helper)(?:\.js)?$/.test(
  source,
);
```

PR #5522 had to add `canonical-table-rebuild` to that list when
`ensureCanonicalTables` moved out of `canonical-schema.ts`. Had it been missed,
the rule would have kept passing on every file — a banned symbol imported from
an unmatched module is simply not reported — so the `*.test.ts` ban on
`ensureCanonicalTables` / `loadCanonicalSchema` / `loadSchema` would have
silently stopped enforcing, with no lint error and no test failure to catch it.
The rule's own unit tests are all hand-written specifier strings, so they cannot
catch it either: they only assert the basenames someone remembered to list.

This is a different hole from `converge-test-infra-lint-scope-lists` (0064),
which covers the hardcoded `ALLOW` **file paths** and the duplicated exemption
globs. This one is about the **module-source matcher**: which modules the
BANNED symbols are considered to live in.

RFC 0064 still has file moves ahead of it, so the next move that relocates a
banned loader reopens the ban silently.

## Acceptance criteria

- The set of modules `isCanonicalSchemaModule` matches is derived from where the
  BANNED symbols are actually exported, not from a hand-maintained basename
  list — or, if a literal list is kept, a guard test fails when a module under
  `packages/activerecord/src/support/` exports a BANNED symbol and is not
  matched by the rule.
- The guard must fail on a synthetic regression (move a banned export to a new
  module basename and confirm the guard trips) — a test that passes both before
  and after is not a guard.
- Behavior unchanged for the currently-matched three modules; the rule's
  existing valid/invalid cases keep passing.
- No new third-party deps.
