---
title: "Delete the actionpack re-export shims and rewrite importers onto @blazetrails/rack-session"
status: draft
updated: 2026-08-31
rfc: "0000-rack-session-gem-port"
cluster: null
packages: ["rack-session", "actionpack"]
deps: ["enroll-rack-session-test-suite"]
deps-rfc: []
est-loc: 250
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Final story. `relocate-rack-session-scaffolding-out-of-actionpack` left
re-export shims at the old actionpack paths so the move was reviewable and
independently revertible; once the port is measured by
`enroll-rack-session-test-suite`, the shims are pure indirection. This mirrors
`0129-ruby-compat/delete-ruby-compat-reexport-shims`.

Importers to rewrite (as of `main` plus PR 7317):
`.../middleware/session/cookie-store.ts`, `cache-store.ts`,
`mem-cache-store.ts`, `resolve-store.ts`, `abstract-store.test.ts`,
`.../request/session.ts`, plus whatever the two 0104 follow-ups
(`cookie-store-runnable-in-a-real-stack`, `port-setup-default-session-store`)
landed against the shim if they merged in the interim.

Also in scope, and the RFC's headline number: every `@nie` marker in
`packages/actionpack/src/action-dispatch/middleware/session/**` is gone — five
on `main` today (`abstract-store.ts:81,86,91,96,104`, all naming the
non-existent `rack/lib/rack/session/abstract/id.rb`), three after PR 7317
(`disposition=TODO`, naming nothing), zero after this story. The prose
references that describe Rack classes as unported also get corrected:
`.../action-controller/metal/request-forgery-protection.ts:54`,
`session/cookie-store.ts:27`, `session/mem-cache-store.ts:7,32,56`,
`packages/trailties/src/application/finisher.ts:28`.

`mem-cache-store.ts:7,32` cite `Rack::Session::Dalli`, which is a **third**
gem (`rack-session-dalli`) that this RFC does not vendor. Leave that citation
as-is and do not repoint it at `rack-session`; note it in the PR body so the
next reader does not mistake it for a straggler.

## Acceptance criteria

- No file under `packages/actionpack/src/` re-exports from
  `@blazetrails/rack-session`; every importer imports directly.
- `grep -rn '@nie' packages/actionpack/src/action-dispatch/middleware/session/`
  returns 0.
- `grep -rn 'rack-session-2\.1\.0/\|rails=rack/lib/rack/session' packages/`
  returns 0.
- Every remaining `Rack::Session::` prose reference either cites a resolving
  `vendor/rack-session/...` path or names `Rack::Session::Dalli`, which is out
  of scope.
- `pnpm parity:api`, `parity:test`, `parity:api:extra --package actionpack` all
  non-negative; `pnpm typecheck`, `pnpm lint` clean.
