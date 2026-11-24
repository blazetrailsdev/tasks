---
title: "actiondispatch: reach 100% on parity"
status: in-progress
rfc: "0259-near-complete-packages-to-100"
cluster: rails-core
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#10710
claim: "2026-11-24T18:06:55Z"
assignee: "actiondispatch-reaches-100"
blocked-by: null
closed-reason: null
updated: 2026-11-24
---

## Context

Measured 2026-11-24 at trails `4330f807e1`: `actiondispatch` is 35 tests short of
100%. 15 of those are skips without a `PERMANENT-SKIP:` line (list them with
`pnpm parity:test -- --package actiondispatch` and grep the TS files for
`it.skip`). The rest are missing. Paths are under `vendor/rails/v8.0.5.2/`:

- `actionpack/test/dispatch/cookies_test.rb` (actiondispatch):
  - signed cookie rotating secret is not rewritten when session is skipped
  - signed cookie read before the session is skipped is not rewritten
  - rotated signed cookie set after reading is written when session is skipped
  - encrypted cookie rotating secret is not rewritten when session is skipped
  - encrypted cookie using hybrid serializer is not rewritten when session is skipped
  - signed cookie is set when session is skipped
- `actionpack/test/dispatch/response_test.rb` (actiondispatch):
  - response does not buffer enumerator body
- `actionpack/test/dispatch/debug_exceptions_test.rb` (actiondispatch):
  - returns empty body on HEAD cascade pass
- `actionpack/test/dispatch/content_security_policy_test.rb` (actiondispatch):
  - hash sources
- `actionpack/test/dispatch/session/cache_store_test.rb` (actiondispatch):
  - session logged out during a request stays logged out
  - session logged out during a writing request stays logged out
  - session logged out during a request does not resend its cookie
  - session reset by the request is saved under the new id
  - session read by legacy id is saved under private id
  - cookie only false reads session id from params
  - same site in subclass default options wins over default
  - initialize does not add same site to the callers options
- `actionpack/test/dispatch/show_exceptions_test.rb` (actiondispatch):
  - rescue with no body for HEAD requests
- `actionpack/test/dispatch/session/abstract_store_test.rb` (actiondispatch):
  - session cookie gets same site from env
  - store composed from the mixins gets same site from env

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for `actiondispatch`.
- [ ] Every remaining `it.skip` in the package sits under a `PERMANENT-SKIP:`
      line citing a CLAUDE.md section or a dated operator ruling.
- [ ] Items needing a ruling are listed in the PR body with their Rails
      `file:line`, and are not receipted until the operator rules.
- [ ] Work past the LOC ceiling is filed as new stories in this RFC, each
      with a `deps` edge from this one.

## Verification

```sh
pnpm parity:test -- --package actiondispatch
```
