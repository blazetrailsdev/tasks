---
title: "StringIO#puts so rack.errors writers call puts as Rails does, not a duck-typing wrapper"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails writes to the error stream with a bare `puts`:

```ruby
env[RACK_ERRORS].puts "Invalid string for method"      # method_override.rb:37
req.get_header(RACK_ERRORS).puts "Invalid or incomplete POST params"  # :50
req.get_header(RACK_ERRORS).puts "Bad request content body"           # :52
```

The Rack SPEC requires `rack.errors` to respond to `puts`, `write` and `flush`,
so the receiver is always safe. trails' `StringIO`
(`packages/activesupport/src/string-io.ts:17`) implements `write` (`:56`) but
**not** `puts`, and `lint.ts:171-173` was written to accept either, so
`packages/rack/src/method-override.ts` carries a module-private `putsError`
helper that duck-types `puts` then falls back to `write` — a wrapper Rails does
not have, standing between a ported body and a one-word Ruby call.

Filed from PR #7315, which converged `method_override_param` onto Rails' body
and had to keep the helper to stay green: two of its three call sites are the
ported lines above.

The same gap is why `mock-request.ts`'s `FatalWarner` (`:33`) had to grow its
own `puts` rather than inheriting one.

## Acceptance criteria

- `StringIO` grows `puts`, mirroring Ruby's `IO#puts` — each argument on its own
  line, a trailing newline appended only when the argument does not already end
  in one, `nil`/no-args writing a bare newline, and an Array flattened.
- `method-override.ts` deletes `putsError` and calls
  `env[RACK_ERRORS].puts(...)` / `req.getHeader(RACK_ERRORS).puts(...)` directly,
  matching `method_override.rb:37,50,52`.
- `lint.ts`'s "must respond to puts or write" check is revisited against the
  SPEC's actual requirement (`puts`, `write` AND `flush`) — narrow it or leave
  it, but decide deliberately rather than by omission.
- Sweep for other `rack.errors` writers that duck-type the sink
  (`sendfile.ts`, `show-exceptions.ts`, `lint.ts`) and converge them too.
- Full rack suite green; `pnpm parity:api:calls` gains no row (the `puts` call
  becomes a real member call, not a helper).
