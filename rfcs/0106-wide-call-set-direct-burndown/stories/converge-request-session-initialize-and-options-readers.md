---
title: "Converge Request::Session's own body onto request/session.rb"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6695
claim: "2026-08-18T13:06:46Z"
assignee: "converge-request-session-initialize-and-options-readers"
blocked-by: null
closed-reason: null
---

# Converge `Request::Session`'s own body onto `request/session.rb`

## Context

PR #6687 ported `Session::Options` faithfully but left the enclosing `Session`
class as it found it. The port
(`packages/actionpack/src/action-dispatch/request/session.ts`) diverges from
`actionpack/lib/action_dispatch/request/session.rb:75-83` structurally:

- Rails' `initialize(by, req, enabled: true)` stores `@by`, `@req`, `@delegate`,
  `@loaded`, `@exists`, `@enabled`, `@id_was`, `@id_was_initialized` and loads
  NOTHING. The port's private constructor takes `(store, env, options, enabled)`
  and eagerly calls `sessionExists` / `loadSession` in the constructor body.
- Rails' `create` (`:19-26`) is `session_was = find req; session = new(store, req);
session.merge! session_was if session_was`. The port hand-rolls the merge with
  an `Object.entries` loop over `toHash()`.
- Rails' `options` (`:90-92`) is `Options.find @req` and `id` (`:82-84`) is
  `options.id(@req)` — now that `Options#id` exists (PR #6687) both can be the
  Rails one-liners. The port instead carries private `options` and `id` FIELDS,
  so `destroy` (`:94-105`) passes the stale constructor hash to `deleteSession`
  rather than `options.id(@req), options`.
- `destroy` also drops Rails' `enabled?` guard and the `@loaded = false;
load_for_write!` reload that follows it.

The `create -> new` and `disabled -> new` `kind: "args"` rows in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/request/session.json`
are this divergence, as is the `load! -> replace` call-set row.

## Acceptance criteria

- [ ] `initialize` takes `(by, req, { enabled = true })`, stores the Rails
      ivars, and does no loading.
- [ ] `options` is `Options.find(this.req)` and `id` is
      `this.options.id(this.req)`; the private `options`/`id` fields go.
- [ ] `destroy` mirrors `:94-105` including the `enabled?` guard and the
      `load_for_write!` reload.
- [ ] The `create -> new`, `disabled -> new` and `load! -> replace` baseline rows
      are DELETED by hand (only-shrink, no reseed).
