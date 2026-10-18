---
title: "Port actionpack/abstract/abstract_controller_test.rb"
status: claimed
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-18T14:40:31Z"
assignee: "temporal-seats-answer-iso8601-and-xmlschema"
blocked-by: null
closed-reason: null
---

## Context

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                                                       | Rails tests | Matched | Missing | trails file                                                                     |
| ------------------------------------------------------------------------------------- | ----------- | ------- | ------- | ------------------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/actionpack/abstract/abstract_controller_test.rb` | 19          | 0       | 19      | `packages/actionview/src/actionpack/abstract/abstract-controller.test.ts` (new) |

`0141` story `port-abstract-controller-test-local-prefixes-cases` covers part of this file; coordinate with it, or take a `deps` edge, rather than porting those cases twice.

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
