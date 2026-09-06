---
title: "BoundedIO#read must raise EOFError, not EmptyContentError"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `BoundedIO#read` in PR #6500.

Rails raises `EOFError, "bad content body"` when the declared content length
does not match the actual body (`rack/lib/rack/multipart/parser.rb:70`, in the
`else` arm of `if str`). The port throws a trails-local
`EmptyContentError` with the same message
(`packages/rack/src/multipart/parser.ts:71`, class declared at
`packages/rack/src/multipart/parser.ts:18`).

Same error class, same message, same raise site is the rule; a caller
rescuing `EOFError` (Ruby's own class, which Rack's callers do distinguish
from Rack's multipart errors) cannot see this one. `EmptyContentError` is also
used for the genuinely-different `handle_empty_content!` path
(parser.rb: `handle_empty_content!`), so the two failure modes are currently
indistinguishable to a caller.

## Acceptance criteria

- [ ] `BoundedIO#read` raises the trails `EOFError` analogue, not
      `EmptyContentError`, with the message `"bad content body"`
      (parser.rb:70).
- [ ] `handle_empty_content!`'s own raise keeps its own class, so the two
      paths stay distinguishable.
- [ ] `packages/rack/src/multipart*` suites green, with a test covering the
      content-length-mismatch arm.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
