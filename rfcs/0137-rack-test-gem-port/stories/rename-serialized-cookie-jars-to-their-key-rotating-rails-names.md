---
title: "SignedCookieJar/EncryptedCookieJar drop Rails' KeyRotating"
status: claimed
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-07T22:55:35Z"
assignee: "default-cookie-serializer-is-marshal-not-json"
blocked-by: null
closed-reason: null
---

## Context

Rails names the two serialized jars `SignedKeyRotatingCookieJar`
(`actionpack/lib/action_dispatch/middleware/cookies.rb:619`) and
`EncryptedKeyRotatingCookieJar` (`:645`) — the `KeyRotating` half is the
`request.cookies_rotations` loop in each constructor (`:620-622`, `:659-680`).

trails calls them `SignedCookieJar` / `EncryptedCookieJar` in
`packages/actionpack/src/action-dispatch/middleware/cookies.ts`. The names
predate PR #7598 and were left alone there because renaming an exported class
touches `action-dispatch/index.ts`, `action-dispatch/cookies.ts` and the
`describe` blocks in two test files.

`ChainedCookieJars#signed` / `#encrypted` construct them (`cookies.rb:253,275`),
so the rename lands at those two call sites plus the class declarations.

## Acceptance criteria

- [ ] `SignedCookieJar` -> `SignedKeyRotatingCookieJar`, `EncryptedCookieJar`
      -> `EncryptedKeyRotatingCookieJar`, at every declaration, re-export and
      call site.
- [ ] `pnpm parity:api --package actionpack` deltas non-negative; both call
      gates green with no new baseline rows.
