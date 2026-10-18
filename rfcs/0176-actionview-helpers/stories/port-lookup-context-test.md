---
title: "Port template/lookup_context_test.rb and move its misplaced tests"
status: done
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9032
claim: "2026-10-18T16:44:52Z"
assignee: "assertion-burndown-debug-exceptions-tests"
blocked-by: null
closed-reason: null
---

## Context

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                                       | Rails tests | Matched | Missing | trails file                                                     |
| --------------------------------------------------------------------- | ----------- | ------- | ------- | --------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/template/lookup_context_test.rb` | 23          | 0       | 18      | `packages/actionview/src/template/lookup-context.test.ts` (new) |

Five tests live in `packages/actionview/src/lookup-context.test.ts` and belong in `template/lookup-context.test.ts`; move them, do not rename them.

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
