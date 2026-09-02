---
title: "Resolve rubyClassPath for stores defined outside abstract/id.ts, so Pool names itself Rack::Session::Pool"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 16
pr: 7384
claim: "2026-09-02T12:03:27Z"
assignee: "add-rack-session-to-generate-stubs-pkg-dirs"
blocked-by: null
closed-reason: null
---

## Context

`rubyClassPath` (`packages/rack-session/src/abstract/id.ts`, a non-exported
module-local map added by `converge-session-hash-inspect-onto-full-class-path`,
PR #7344) is how trails spells Ruby's `self.class` / `self.class.name` — it
switches on the constructor and returns the full Ruby constant path.

Two Ruby bodies read it:

```ruby
"#<#{self.class}:0x#{self.object_id.to_s(16)} not yet loaded>"
```

(`vendor/rack-session/lib/rack/session/abstract/id.rb:155`) and

```ruby
req.get_header(RACK_ERRORS).puts("Warning! #{self.class.name} failed to save session. Content dropped.")
```

(`vendor/rack-session/lib/rack/session/abstract/id.rb:396`, routed through
`rack.errors` in PR #7356).

Both interpolate the RECEIVER's class, so a store defined outside
`abstract/id.ts` has to be in the map too. It cannot be: `pool.ts` imports
`abstract/id.ts`, so `id.ts` cannot import `Pool` back without closing a cycle
whose participants include `class Pool extends PersistedSecure`. The map
therefore covers only `SessionHash`, `SecureSessionHash`, `Persisted`,
`PersistedSecure` and `ID`, and falls through to `(klass as {name}).name` for
everything else.

The observable divergence: a `Rack::Session::Pool` whose `write_session` returns
falsy writes `Warning! Pool failed to save session. Content dropped.` where Ruby
writes `Warning! Rack::Session::Pool failed to save session. Content dropped.`
(`Rack::Session::Pool` is `pool.rb:17`). No test pins it today — the ported
`spec_session_pool.rb` never drives a failed write — which is why it survived
review.

Surfaced in PR #7356 while porting `spec_session_abstract_persisted.rb`'s
"#commit_session writes to rack.errors if session cannot be written", which
pins the `Persisted` spelling and so needed the map extended in the first place.

## Converged shape

The receiver's Ruby constant path has to reach `rubyClassPath` from the module
that defines the class, not from `id.ts`. The settled trails idiom for exactly
this shape — a value a downstream module must publish back to an upstream one
without closing an import cycle — is the zero-import slot module (CLAUDE.md,
"Call-time constant resolution"): a file with no runtime imports exporting a
mutable registry plus a setter, which `pool.ts` (and any later store) calls at
the bottom of its own body, and which `rubyClassPath` consults before its
`default` arm.

Whatever carries the name must not become measured surface — a module-local
registry or a receipt, the same constraint
`converge-session-hash-inspect-onto-full-class-path` shipped under.

## Acceptance criteria

- `rubyClassPath` resolves `Pool` to `Rack::Session::Pool`, without `id.ts`
  importing `pool.ts`.
- A test pins the failed-save `rack.errors` line for a `Pool` store (drive it
  with a `writeSession` that returns falsy, as
  `spec_session_abstract_persisted.rb:31-48` does for `Persisted`), and pins
  `Pool`'s not-yet-loaded `inspect` form.
- `pnpm parity:api:extra --package rack-session` gains no novel name.
- The mechanism is documented once, where the other slot modules are, rather
  than re-derived per store.
