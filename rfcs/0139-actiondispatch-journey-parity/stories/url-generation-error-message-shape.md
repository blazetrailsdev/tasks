---
title: "url-generation-error-message-shape"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails raises `ActionController::UrlGenerationError` from
`Journey::Formatter::MissingRoute#path` with a message built in
`MissingRoute#message`
(`vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:52-56`):

    No route matches {:controller=>"foo"}, missing required keys: [:id]

with `, possible unmatched constraints: [...]` appended when
`unmatched_keys` is non-empty. The keys come from `Formatter#missing_keys`
(`formatter.rb:145-161`) and the split into missing vs unmatched from
`generate` (`formatter.rb:104-106`).

trails raises the right class since #7610 but with an invented message,
`Missing required parameter :id for route "post"`, built in `Route#pathFor`
(`packages/actionpack/src/action-dispatch/routing/route.ts`) — one message per
offending key rather than one naming all of them, with no
`No route matches …` prefix and no unmatched-constraints arm.

Surfaced by #7610: `journey/router_test.rb`'s
`knows what parts are missing from named route` asserts
`assert_match(/missing required keys: \[:id\]/, error.message)` and
`does not include missing keys message` asserts the `assert_no_match` twin
(`vendor/rails/actionpack/test/journey/router_test.rb:90-105`). Both ports
assert the trails string instead.

## Acceptance criteria

- The `UrlGenerationError` message matches `MissingRoute#message` — the
  `No route matches <inspect>` prefix, the sorted `missing required keys:`
  clause, and the `possible unmatched constraints:` clause.
- The raise site collects every missing key rather than throwing on the first,
  mirroring `Formatter#missing_keys`.
- `journey/router.test.ts`'s two tests above assert the Rails regexes, and the
  ~13 other call sites asserting the old string are updated.
- `pnpm parity:test --package actiondispatch` assertion-value count does not
  rise.
