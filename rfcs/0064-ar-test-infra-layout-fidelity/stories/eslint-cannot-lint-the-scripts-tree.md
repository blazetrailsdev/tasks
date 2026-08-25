---
title: "scripts/ is globally ignored by ESLint so no lint rule reaches it"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5700
claim: "2026-07-31T01:33:04Z"
assignee: "eslint-cannot-lint-the-scripts-tree"
blocked-by: null
closed-reason: null
---

## Context

`eslint.config.mjs:114` puts `scripts/**` in the config's top-level `ignores`,
so no ESLint rule runs against the ~505-file `scripts/` tree at all. PR #5694
hit this while widening `blazetrails/no-internal-canonical-loaders` beyond
`packages/activerecord`: the rule's `files` glob
(`canonicalLoaderEnforcedGlobs`, `eslint/test-infra-scope.mjs`) covers
`packages/**` only, and `scripts/` had to be declared
`canonicalLoaderUnenforceableRoots` rather than given a glob that would silently
never match.

The discovery scan (`canonicalLoaderScanRoots`) does walk `scripts/`, so a
loader _module_ relocated there is still forced into `canonicalLoaderModules`,
but a `scripts/*.test.mjs` importing a banned loader is unlintable. The same
blind spot applies to every other repo lint rule, not just this one.

Un-ignoring `scripts/` is the fix, but it is its own piece of work: 505 files
that have never been linted will surface a backlog of violations, and the tree
mixes `.ts` (tsx-run) with `.mjs`, so the typed-parser project service needs
checking per file group.

`no-internal-canonical-loaders.test.mjs` already pins this: it re-derives the
unenforceable set from the config's real global-ignore list, so removing
`scripts/**` from `ignores` fails until `canonicalLoaderEnforcedGlobs` widens
with it.

## Acceptance criteria

- `scripts/**` is removed from the top-level `ignores` in `eslint.config.mjs`
  (or narrowed to the specific subtrees that genuinely cannot be linted, with
  the reason recorded).
- Violations surfaced by the newly-linted tree are fixed, or ratcheted with an
  explicit allowlist that names why each entry is deferred.
- `canonicalLoaderEnforcedGlobs` gains a `scripts/` glob and
  `canonicalLoaderUnenforceableRoots` shrinks accordingly; the
  "wires the rule to every scan root eslint can lint" test passes without
  being weakened.
- Verified: a `scripts/*.test.mjs` importing `loadCanonicalSchema` is reported
  by `npx eslint`, and lints clean once the import is removed.
