---
title: "port-test-case-rb-remaining-members"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (forced run, 2026-10-20) reports `test_case.rb` as
actionview's largest _ported-file_ API gap: **23 methods missing**. The
missing names come back as reader/writer pairs —
`controller`, `controller=`, `request`, `request=`, `outputBuffer`,
`outputBuffer=`, `rendered`, `rendered=` and the rest of
`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb`.

`port-actionview-test-case` and `port-template-test-case-test` are both
`done`, and `template/test_case_test.rb` is at 42/48 with 6 skipped, so the
test half is largely in place while the API half is not. The pair shape
suggests the readers exist as something the extractor does not credit as the
Rails member (an `attr_accessor`-shaped pair, or members on a mixin
declaration) rather than 23 genuinely absent behaviours — confirm which before
writing code.

Three sibling stories are already open on this file and should not be
duplicated: `actionview-test-case-not-in-published-build` (in-progress),
`actionview-test-case-mounted-routes-test` and
`actionview-test-case-pattern-matching-tests`.

## Acceptance criteria

- Each of the 23 missing names is either ported at its Rails name, or
  explained — a credit bug gets a fix in `scripts/api-compare`, not a tag.
- `pnpm parity:api --package actionview` shows `test_case.rb` at 0 missing.
- `pnpm parity:api:extra:gate` and `pnpm parity:api:params` stay green.
