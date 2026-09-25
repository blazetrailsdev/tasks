---
title: "Version the MRI citation lint and its resolver"
status: draft
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - ruby-compat
deps: [nest-vendored-clones-under-a-version-directory]
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`eslint/ruby-compat-needs-mri-citation.mjs` is the one rule that *resolves* a
citation rather than just requiring one: it requires a
`vendor/ruby/<file>:<line>` citation plus a `@noRailsEquivalent PERMANENT`
receipt on every ruby-compat export (`:158`), and reports a cited file the pinned
checkout does not contain (`:167`) or a line past the file's end (`:169`) —
ruby-compat's fidelity anchor in place of the `parity:api` comparison it can never
have (`packages/ruby-compat/README.md:108`, `eslint.config.mjs:734-744`).

Its matcher is `const CITATION = /vendor\/ruby\/([A-Za-z0-9_./+-]+):(\d+)/g`
(`:36`). The character class admits both `.` and `/`, so a versioned citation
**still matches** and captures `rel = "v3.3.11/rational.c"`. Joined onto a clone
root that now already ends in `v3.3.11`, every resolution fails — so the rule
would flip to "cites a file the checkout does not contain" for the whole package,
and it would do so only in the `rails-comparison` job (the one that fetches
`vendor/ruby`), not locally. This lands before any ruby-compat sweep.

`scripts/api-compare/jsdoc-tag-line.test.ts:13,78` and
`eslint/ruby-compat-needs-mri-citation.test.mjs:31,115` build citation fixtures and
a stand-in tree; they are logic, not citations, and are updated by hand here
rather than by the codemod.

## Acceptance criteria

- The rule requires the version segment: a citation without one is an error naming
  `pnpm vendor:recite` as the remedy, and the captured `rel` is relative to the
  version directory so resolution works.
- The version it requires is the active one, read from `vendor/sources.lock.json`
  through the same helper `vendor/sources.ts` uses — not a literal in the rule.
- The existing three arms (missing citation, unresolvable file, out-of-range line)
  all still fire, with their current message text apart from the added version.
- `ruby-compat-needs-mri-citation.test.mjs` covers: versioned + resolvable (clean),
  versioned + wrong version (error), unversioned (error), and the no-vendor-tree
  path at `:115` still skips resolution rather than failing.
- `jsdoc-tag-line.test.ts`'s citation fixtures are updated by hand and its test
  names are unchanged.
- Verified against a real fetched `vendor/ruby/v3.3.11` tree, not only fixtures —
  the failure mode this story exists to prevent is invisible without one.
