---
title: "Port compiled_templates, partial_iteration, template_error, test_test and testing resolver suites"
status: draft
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
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

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                                                 | Rails tests | Matched | Missing | trails file                                                               |
| ------------------------------------------------------------------------------- | ----------- | ------- | ------- | ------------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/template/compiled_templates_test.rb`       | 6           | 0       | 6       | `packages/actionview/src/template/compiled-templates.test.ts` (new)       |
| `vendor/rails/v8.0.2/actionview/test/template/partial_iteration_test.rb`        | 5           | 0       | 5       | `packages/actionview/src/template/partial-iteration.test.ts` (new)        |
| `vendor/rails/v8.0.2/actionview/test/template/template_error_test.rb`           | 4           | 0       | 4       | `packages/actionview/src/template/template-error.test.ts` (new)           |
| `vendor/rails/v8.0.2/actionview/test/template/test_test.rb`                     | 7           | 0       | 7       | `packages/actionview/src/template/test.test.ts` (new)                     |
| `vendor/rails/v8.0.2/actionview/test/template/testing/fixture_resolver_test.rb` | 5           | 0       | 5       | `packages/actionview/src/template/testing/fixture-resolver.test.ts` (new) |
| `vendor/rails/v8.0.2/actionview/test/template/testing/null_resolver_test.rb`    | 1           | 0       | 1       | `packages/actionview/src/template/testing/null-resolver.test.ts` (new)    |

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
