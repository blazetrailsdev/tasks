---
title: "protectedparams-dup-preserves-permitted"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5703
claim: "2026-07-31T02:18:03Z"
assignee: "protectedparams-dup-preserves-permitted"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ProtectedParams` overrides `dup` so the copy keeps `@permitted`:

```ruby
def dup
  super.tap do |duplicate|
    duplicate.instance_variable_set :@permitted, @permitted
  end
end
```

(`vendor/rails/activerecord/test/support/stubs/strong_parameters.rb:33-37`.)

The trails port
(`packages/activerecord/src/support/stubs/strong-parameters.ts`) has never
implemented it. Nothing in the AR suite calls `dup` on the stub, so no test
fails today, and `pnpm parity:api --package activerecord-test-support` reads
32/32 without it — this is a silent gap, not a ratchet regression.

Noted during review of PR #5690, which moved the parameters off the instance
into a private `#parameters` field behind a Proxy. That refactor is the reason
`dup` is now implementable in a Rails-shaped way: `permitted` state lives in
`#permitted` and the parameter store in `#parameters`, so a copy constructor
can carry both. A `dup` port has to account for the Proxy — the copy must be a
fresh `ProtectedParams` (hence a fresh Proxy) over a shallow copy of the
parameters, not a structural clone of the wrapper.

## Acceptance criteria

- `ProtectedParams` exposes `dup` mirroring strong_parameters.rb:33-37: a new
  instance over a shallow copy of the parameters, with `permitted` carried over.
- A test pins that `dup` of a permitted params object is still permitted, and
  that mutating the copy's parameters does not affect the original.
- `pnpm parity:api --package activerecord-test-support` does not regress.
