---
title: "converge-rack-session-options-onto-hash-reads"
status: in-progress
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7344
claim: "2026-09-01T17:30:03Z"
assignee: "converge-rack-session-options-onto-hash-reads"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Abstract::Persisted` reads its options as a **plain Ruby Hash**:
`options[:skip]` (`vendor/rack-session/lib/rack/session/abstract/id.rb:351`),
`options[:drop]` / `options[:renew]` (`:382-383`), `options[:secure]` (`:372`),
`options.values_at(:max_age, :renew, :drop, :defer, :expire_after)` (`:368`)
and `options.to_hash` (`:413`). `values_at` and `to_hash` are Hash methods, and
`[]` is Hash's own reader — a plain Hash satisfies every call.

`SessionHash#options` is `@req.session_options` (`:79-81`), which
`Rack::Request::Helpers#session_options` (`vendor/rack/lib/rack/request.rb:213`)
answers as a plain Hash, and `Persisted#prepare_session` seats one:
`req.set_header RACK_SESSION_OPTIONS, @default_options.dup` (`:311`).

trails instead declares a `SessionOptions` interface with `get()` / `valuesAt()`
/ `toHash()` (`packages/rack-session/src/abstract/id.ts`), and
`Persisted.isCommitSession` / `isForceOptions` / `isSecurityMatches` /
`commitSession` call `options.get("skip")` and friends on it. The interface is a
structural stand-in for TWO different things — Rack's Hash and
`ActionDispatch::Request::Session::Options`
(`vendor/rails/actionpack/lib/action_dispatch/request/session.rb:47`), which is a
real Rails class with `[]` / `values_at` / `to_hash`.

The consequence is a live type lie. `prepareSession` seats a plain object
(`req.setHeader(RACK_SESSION_OPTIONS, { ...this.defaultOptions })`), and
`@blazetrails/rack`'s real `Request.sessionOptions`
(`packages/rack/src/request.ts:504`) returns `Record<string, any>` — neither has
`.get`. Until PR #7335 `Persisted#sessionClass` threw unconditionally, so no
end-to-end `Persisted.call()` ever reached `commitSession`; now that it returns
a real `SessionHash`, the first `Pool` / `Cookie` store wired through it will
raise `options.get is not a function`. Found in review of #7335.

## Acceptance criteria

- `Persisted`'s option reads spell Ruby's Hash reads — `options["skip"]`,
  `options["drop"]`, `options["renew"]`, `options["secure"]`, a `valuesAt` over
  the five force keys, and `toHash` — against the plain object
  `prepare_session` actually seats.
- The `SessionOptions` interface is deleted, or narrowed to the
  `ActionDispatch::Request::Session::Options` class it genuinely mirrors, and
  `PersistedRequest.sessionOptions` stops being a `SessionOptions | Record`
  union.
- actionpack's `Options` object keeps working through whichever shape survives
  (it defines `[]`, `values_at` and `to_hash` in Ruby, so a Hash-shaped read is
  the one both sides answer).
- An end-to-end test drives `Persisted#call` through `commitSession` with a real
  `@blazetrails/rack` `Request`, which no test does today.
- `parity:api` rack-session non-negative; `parity:api:extra` loses the
  `SessionOptions` receipt rather than re-tagging it.
