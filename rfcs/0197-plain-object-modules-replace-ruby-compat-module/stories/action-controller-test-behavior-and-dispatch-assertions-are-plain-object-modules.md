---
title: "ActionController::TestCase::Behavior and ActionDispatch::Assertions are plain-object modules"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["actionpack", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9083 made `Rails::Dom::Testing::Assertions` a plain-object module. Its two includers are still ruby-compat `Module`s:

- `ActionController::TestCase::Behavior` at `packages/actionpack/src/action-controller/test-case.ts:496-500`, which mirrors `actionpack/lib/action_controller/test_case.rb:371-375`.
- `ActionDispatch::Assertions` at `packages/actionpack/src/action-dispatch/testing/assertions.ts:37-42`, which mirrors `actionpack/lib/action_dispatch/testing/assertions.rb:10-15`.

To cope with that, trails#9083 added `Module`-side arms in `packages/ruby-compat/src/include.ts`:

- `recordPlainModule` and `splicePlainModule`
- the plain branches of `isInclude`, `ancestors`, `appendFeatures`' nested loop and `extendObject`

These arms exist only so a `Module` can include a plain module that itself includes modules.

## Acceptance criteria

- [ ] `Behavior` and `ActionDispatch::Assertions` are plain-object modules (with `Concern` and `included` hooks as in Rails).

- [ ] `recordPlainModule`, `splicePlainModule` and the plain arms named above are deleted from `include.ts` once no `Module` includes a composite plain module.

- [ ] The `TestCaseTest` assert_select tests (`test_case_test.rb:223,230,431,444`) stay green.
