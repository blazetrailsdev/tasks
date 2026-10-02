---
title: "Fold action-controller/test-case.test.ts (no Rails counterpart) into test-case.trails.test.ts"
status: done
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8401
claim: "2026-10-02T15:01:54Z"
assignee: "action-controller-test-case-test-is-a-rails-shaped-name-with-no-rails-file"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/test-case.test.ts` is a
Rails-shaped file name with no Rails counterpart: Rails' tests for
`action_controller/test_case.rb` live in
`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb`, which
trails mirrors at
`packages/actionpack/src/action-controller/controller/test-case.test.ts`.
There is no `actionpack/test/test_case_test.rb`, and `parity:test`'s
convention comparison does not list the file at all.

Its four describes hold trails-only tests, none named in `test_case_test.rb`:

- `TestSession Rails-mirroring API` (`isExists` / `keys` / `destroy` / `dig` /
  `fetch` / `idWas`)
- `TestCase class helpers` (`tests(class)`, `tests(string)`,
  `controllerClassName`, `determineDefaultControllerClass`)
- `ActionController::TestRequest helpers` (`queryString=`, `contentType=`,
  `newSession`, `create`, `defaultEnv`, `assignParameters`, `paramsParsers`)
- `ActionController::LiveTestResponse predicates`

trails#8382 moved the trails-only `PostsController` block out of
`controller/test-case.test.ts` into
`packages/actionpack/src/action-controller/test-case.trails.test.ts`, which is
where TS-only tests for this source file belong. This sibling file was out of
that story's scope and its LOC budget.

## Acceptance criteria

- `packages/actionpack/src/action-controller/test-case.test.ts` no longer
  exists.
- Each of its tests either moves to
  `packages/actionpack/src/action-controller/test-case.trails.test.ts` with its
  name unchanged, or is deleted where a Rails-named test in
  `controller/test-case.test.ts` (or a test already in the `.trails.test.ts`
  file, e.g. its `TestRequest#assignParameters` describes) covers the same
  behaviour. The PR body lists each deletion with the test that covers it.
- `parity:test` matched count for `controller/test_case_test.rb` is unchanged.
