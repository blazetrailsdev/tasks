---
title: "activesupport tests: migrate 168 ruby-compat barrel imports to subpaths"
status: done
updated: 2026-11-26
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 340
priority: null
pr: trails#10819
claim: "2026-11-26T21:14:45Z"
assignee: "migrate-activerecord-test-models-and-support-off-the-ruby-compat-barrel"
blocked-by: null
closed-reason: null
---

## Context

trails#10746 moved every `packages/activesupport/lib` import off the `@blazetrails/ruby-compat`
barrel. The test tree was left on it: 161 files under `packages/activesupport/test` hold 168
`from "@blazetrails/ruby-compat"` imports (counted at merge). This is the activesupport sibling of
`migrate-actionpack-tests-off-the-ruby-compat-barrel` and
`migrate-activemodel-and-arel-tests-off-the-ruby-compat-barrel`.

The rewrite in trails#10746 resolved each binding's owner with the TS checker against
`packages/ruby-compat/lib/index.ts` and checked the owner exports it under the same name, and
made type-only bindings `import type`. Barrel re-exports (`export … from`) needed hand mapping.
Note the `rails-error-parity` rule now accepts subpath imports (trails#10746).

## Acceptance criteria

- `grep -r 'from "@blazetrails/ruby-compat"' packages/activesupport/test` returns 0.
- Every replaced import names the module that owns the binding; type-only uses are `import type`.
- No test renamed; affected test files green.
