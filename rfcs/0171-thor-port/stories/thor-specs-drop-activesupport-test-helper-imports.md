---
title: "Thor specs drop their @blazetrails/activesupport test-helper imports and the import-boundary ignores list"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`eslint/thor-import-boundary.mjs` forbids a file under `packages/trailties/src/thor/` from
importing any `@blazetrails/*` but `ruby-compat` and `did-you-mean`
(`vendor/thor/v1.3.2/thor.gemspec` declares no runtime dependency).
`thor-actions-spec-hosts-on-thor-group-and-drops-boundary-exemption` rehosted
`actions.test.ts` on `Thor::Group` and narrowed the block's `ignores` in `eslint.config.mjs`
from `**/*.test.ts` to the fourteen test files that still import
`@blazetrails/activesupport`:

- `capture` (Thor's own is `spec/helper.rb:57-68`, `$stdout = StringIO.new`):
  `actions.trails.test.ts`, `actions/create-file.trails.test.ts`,
  `actions/file-manipulation.trails.test.ts`, `shell.test.ts`, `shell.trails.test.ts`,
  `shell/color.test.ts`, `shell/table-printer.trails.test.ts`.
- `assertRaises` / `assertNothingRaised` / `assertPredicate` / `assertNotPredicate` /
  `assertEmpty`: `parser/argument.test.ts`, `parser/arguments.test.ts`,
  `parser/option.test.ts`, `parser/options.test.ts`, `nested-context.test.ts`,
  `line-editor/basic.test.ts`, `util.test.ts`.

About 120 call sites. `actions.test.ts` already carries a same-file `capture` over
ruby-compat's `stdout` and a same-file `assertEmpty`; the assertion comparer has no vitest
matcher for the `empty` kind (`scripts/test-compare/assertion-kinds.ts`), so a `be_empty`
needs a helper named `assertEmpty` to keep its kind, and the thor assertion mark is 0.

## Acceptance criteria

- [ ] None of the fourteen files imports `@blazetrails/activesupport`.
- [ ] The `ignores` list is deleted from the `thor-import-boundary` block, and
      `pnpm exec eslint packages/trailties/src/thor` is green.
- [ ] `pnpm parity:test:assertions` stays green with the thor mark at 0.
