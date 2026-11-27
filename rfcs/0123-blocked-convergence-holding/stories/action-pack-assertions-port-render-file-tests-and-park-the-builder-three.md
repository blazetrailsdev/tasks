---
title: "actionpack: port the two render_file tests, park the three Builder tests permanently"
status: done
updated: 2026-11-27
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10840
claim: "2026-11-27T15:11:00Z"
assignee: "action-pack-assertions-port-render-file-tests-and-park-the-builder-three"
blocked-by: null
closed-reason: null
---

## Context

Replaces `port-action-pack-assertions-render-file-builder-and-api-skips`, closed
as FALSIFIED in the 2026-10-08 blocked-story triage: its acceptance criteria
asked for all six stubbed tests in
`packages/actionpack/src/action-controller/controller/action-pack-assertions.test.ts`
(`:147`, `:468`) to be replaced with their Rails bodies, and three of them
cannot be.

Rails source:
`vendor/rails/v8.0.2/actionpack/test/controller/action_pack_assertions_test.rb`.

- The two `render_file` tests are portable now: they need
  `README.rdoc` vendored into `packages/actionpack`.
- The three "rendering xml ..." tests render through the Builder template
  handler. `builder-template-handler-and-actionpack-builder-fixtures` closed as
  will-not-port (trails#8135 recorded `template/handlers/builder.rb` in
  `scripts/parity/unported-files/actionview.ts`).
- `test_with_routing_works_with_api_only_controllers` waits on
  `api-redirect-to-override-and-head-response-are-invented`; `API` still
  includes only `StrongParameters`
  (`packages/actionpack/src/action-controller/api.ts:59`).

## Acceptance criteria

The three "rendering xml" tests were ported by trails#10512 once the Builder
handler landed; they are out of scope here.

- The two `render_file` tests carry their Rails bodies and pass.
- The API-only test keeps a `BLOCKED:` line naming
  `api-redirect-to-override-and-head-response-are-invented`.
- No line in the file cites the closed story.
