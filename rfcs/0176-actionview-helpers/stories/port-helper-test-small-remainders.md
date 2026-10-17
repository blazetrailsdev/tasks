---
title: "Port the small remainders of the text, tag, TSE and JavaScript helper suites"
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

| Rails test file                                                                 | Rails tests | Matched | Missing | trails file                                                         |
| ------------------------------------------------------------------------------- | ----------- | ------- | ------- | ------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/template/text_helper_test.rb`              | 73          | 66      | 7       | `packages/actionview/src/template/text-helper.test.ts`              |
| `vendor/rails/v8.0.2/actionview/test/template/tag_helper_test.rb`               | 93          | 88      | 5       | `packages/actionview/src/template/tag-helper.test.ts`               |
| `vendor/rails/v8.0.2/actionview/test/template/erb/tag_helper_test.rb`           | 5           | 0       | 5       | `packages/actionview/src/template/tse/tag-helper.test.ts` (new)     |
| `vendor/rails/v8.0.2/actionview/test/template/erb_util_test.rb`                 | 17          | 12      | 5       | `packages/actionview/src/template/tse-util.test.ts`                 |
| `vendor/rails/v8.0.2/actionview/test/template/javascript_helper_test.rb`        | 8           | 7       | 1       | `packages/actionview/src/template/javascript-helper.test.ts`        |
| `vendor/rails/v8.0.2/actionview/test/template/dependency_tracker_test.rb`       | 25          | 21      | 4       | `packages/actionview/src/template/dependency-tracker.test.ts`       |
| `vendor/rails/v8.0.2/actionview/test/template/form_options_helper_i18n_test.rb` | 2           | 1       | 1       | `packages/actionview/src/template/form-options-helper-i18n.test.ts` |
| `vendor/rails/v8.0.2/actionview/test/activerecord/polymorphic_routes_test.rb`   | 145         | 144     | 1       | `packages/actionview/src/activerecord/polymorphic-routes.test.ts`   |
| `vendor/rails/v8.0.2/actionview/test/template/erb/erbubi_test.rb`               | 1           | 0       | 1       | `packages/actionview/src/template/tse/erbubi.test.ts` (new)         |
| `vendor/rails/v8.0.2/actionview/test/template/erb/form_for_test.rb`             | 1           | 0       | 1       | `packages/actionview/src/template/tse/form-for.test.ts` (new)       |

`erb/` suites map to `template/tse/` and spell `tse` in test names (docs/ruby-ts-conventions.md).

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
