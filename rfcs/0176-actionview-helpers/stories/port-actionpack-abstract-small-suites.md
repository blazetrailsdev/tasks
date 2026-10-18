---
title: "Port actionpack abstract helper/render and controller capture suites"
status: done
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9028
claim: "2026-10-18T14:40:31Z"
assignee: "temporal-seats-answer-iso8601-and-xmlschema"
blocked-by: null
closed-reason: null
---

## Context

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                                             | Rails tests | Matched | Missing | trails file                                                           |
| --------------------------------------------------------------------------- | ----------- | ------- | ------- | --------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/actionpack/abstract/helper_test.rb`    | 8           | 0       | 8       | `packages/actionview/src/actionpack/abstract/helper.test.ts` (new)    |
| `vendor/rails/v8.0.2/actionview/test/actionpack/abstract/render_test.rb`    | 7           | 0       | 7       | `packages/actionview/src/actionpack/abstract/render.test.ts` (new)    |
| `vendor/rails/v8.0.2/actionview/test/actionpack/controller/capture_test.rb` | 6           | 0       | 6       | `packages/actionview/src/actionpack/controller/capture.test.ts` (new) |

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
