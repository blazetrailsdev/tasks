---
title: "Remove integration.ts's four invented assertion helpers"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actiondispatch` reports four novel public names
on `packages/actionpack/src/action-dispatch/testing/integration.ts` — public TS
members in a Rails-matched file with no counterpart anywhere in
`actionpack/lib/action_dispatch/testing/integration.rb` or the modules it
includes:

- `assertContentType`
- `assertFlash`
- `assertHeader`
- `followRedirect`

All four are pre-existing (they predate PR #7468, which removed two others —
`registerController` and `formatToMime` — while converging `#process` onto the
app stack). None carries a `@noRailsEquivalent` receipt.

Rails' real spellings for what three of them approximate:

- content type → `assert_response` plus `response.content_type`; there is no
  `assert_content_type`. `ActionDispatch::Assertions::ResponseAssertions`
  (`actionpack/lib/action_dispatch/testing/assertions/response.rb:15-77`)
  defines only `assert_response` and `assert_redirected_to`.
- headers → no Rails assertion; tests read `response.headers[...]` directly.
- flash → no Rails assertion; tests read `flash[...]`. `flash` itself is real
  (`actionpack/lib/action_dispatch/testing/test_process.rb:23-25`).
- `followRedirect` duplicates `followRedirectBang`, the port of
  `follow_redirect!` (`integration.rb:378`, generated into
  `Integration::Runner` by the `%w(get post patch put head delete cookies
assigns follow_redirect!)` loop). Rails has no non-bang form.

## Converged shape

Delete all four and rewrite their call sites onto the Rails surface —
`assertResponse` + a direct `response.contentType` / `response.headers` /
`flash` read, and `followRedirectBang` for the redirect. `parity:api:extra
--package actiondispatch` should report `testing/integration.ts` at 0 novel.

If a call site genuinely cannot be expressed on the Rails surface, that is the
finding to report — do not close this by adding `@noRailsEquivalent` receipts,
which would ratify the invented surface rather than converge it.

## Acceptance criteria

- [ ] `assertContentType`, `assertFlash`, `assertHeader` and `followRedirect`
      are gone from `integration.ts`.
- [ ] Every call site uses the Rails-shaped equivalent.
- [ ] `pnpm parity:api:extra --package actiondispatch` reports 0 novel for
      `testing/integration.ts`.
- [ ] No new `@noRailsEquivalent` receipt is added to that file.
