---
title: "Port template/test_case_test.rb"
status: draft
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                                  | Rails tests | Matched | Missing | trails file                                                |
| ---------------------------------------------------------------- | ----------- | ------- | ------- | ---------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/template/test_case_test.rb` | 48          | 0       | 48      | `packages/actionview/src/template/test-case.test.ts` (new) |

`test_case.rb` is still in `scripts/parity/unported-files/actionview.ts`; porting `ActionView::TestCase` far enough for this suite is in scope, or wire a `deps` edge to the story that ports it.

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
