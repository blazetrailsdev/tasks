---
title: "ruby-compat: receipt lint and stale-tag gate contradict each other on a _-prefixed export"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8350. Two CI gates contradict each other for a
`_`-prefixed export in a ruby-compat file that is not a platform adapter:

- `blazetrails/ruby-compat-needs-mri-citation`
  (`eslint/ruby-compat-needs-mri-citation.mjs`) requires a
  `@noRailsEquivalent PERMANENT` receipt on every export.
- `scripts/api-compare/extra-surface.ts` never counts a `_`-prefixed name
  (`m.name.startsWith("_")`, around lines 1142-1178), so it reports that same
  receipt as a STALE tag and fails the run.

`_resetConstants` moved from activesupport to
`packages/ruby-compat/src/variable.ts` hit both, and the only spelling both
gates accept was dropping the underscore (`resetConstants`). The one other
underscore export, `__INTERNAL_resetProcessAdapter_TEST_ONLY`
(`packages/ruby-compat/src/process-adapter.ts`), escapes only because its file
is in the lint rule's `ignores` list.

## Acceptance criteria

- [ ] The two gates agree on a `_`-prefixed ruby-compat export: either the
      lint rule exempts it (it is unmeasured surface), or the stale-tag check
      does not flag a receipt the lint rule requires.
- [ ] A fixture or test in `eslint/ruby-compat-needs-mri-citation.test.mjs` or
      the extra-surface tests pins the agreed behaviour.
