---
title: "Port template/render_test.rb"
status: claimed
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: "2026-10-19T21:57:49Z"
assignee: "port-template-render-test"
blocked-by: null
closed-reason: null
---

## Context

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                               | Rails tests | Matched | Missing | trails file                                       |
| ------------------------------------------------------------- | ----------- | ------- | ------- | ------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/template/render_test.rb` | 147         | 6       | 138     | `packages/actionview/src/template/render.test.ts` |

Three tests already exist in the wrong files (`base.test.ts`: "render file with relative path", "render inline with locals"; `renderer/template-renderer.trails.test.ts`: "render file with invalid full path"); move them into `template/render.test.ts`. The suite is larger than one PR: ship what fits and register the rest with `pnpm tasks new`.

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
