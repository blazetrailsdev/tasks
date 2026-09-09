---
title: "Live::ClientDisconnected extends bare Error with an invented constructor where Rails has an empty RuntimeError subclass"
status: done
updated: 2026-09-09
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 30
pr: 7640
claim: "2026-09-09T12:54:47Z"
assignee: "pg-and-mysql2-execute-return-rows-not-internal-execute-result"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Live::ClientDisconnected` is a `RuntimeError` subclass with an
empty body:

```ruby
class ClientDisconnected < RuntimeError
end
```

(`vendor/rails/actionpack/lib/action_controller/metal/live.rb:148`)

The class ancestry is load-bearing, not incidental — `live.rb:192` comments on it
explicitly: "Raise ClientDisconnected, which is a RuntimeError (not an IOError),
because ...". So the `RuntimeError`/`IOError` split at that raise site is a
distinction Rails deliberately draws.

`packages/actionpack/src/action-controller/metal/live.ts:8-13` ports it as:

```ts
export class ClientDisconnected extends Error {
  constructor(message?: string) {
    super(message ?? "client disconnected");
    this.name = "ClientDisconnected";
  }
}
```

Three deviations in six lines:

- it extends `globalThis.Error`, not ruby-compat's `RuntimeError`
  (`packages/ruby-compat/src/runtime-error.ts`), so `e instanceof RuntimeError`
  is false where Ruby's `ClientDisconnected === RuntimeError` ancestry is true —
  and the `RuntimeError`-not-`IOError` contrast `live.rb:192` names is lost;
- it declares a constructor Rails' empty class body has no counterpart for;
- the `message ?? "client disconnected"` default invents a message string Ruby
  does not supply, and `this.name` hand-sets what the class ancestry should
  carry.

Surfaced in #7629 while converging the sibling `Live::Buffer#write` raise from a
bare `Error` to `IOError` — the two sites are eight lines apart in the same file.

## Converged shape

```ts
export class ClientDisconnected extends RuntimeError {}
```

importing `RuntimeError` from `@blazetrails/ruby-compat`, which `live.ts` already
imports from (it takes `IOError` and `merge` from there today). Deleting the
constructor also lowers actionpack's extra-surface `total` rather than raising it.

Call sites that relied on the defaulted message must pass `"client disconnected"`
explicitly wherever Rails' own raise site does; check `live.rb:192` and the
`ignore_disconnect` path in `Buffer#write` (`live.rb:105-116`) for the argument
Rails actually passes.

## Acceptance criteria

- [ ] `ClientDisconnected` extends ruby-compat's `RuntimeError` and has an empty
      body, matching `live.rb:148`.
- [ ] Every raise site passes the message Rails passes at that site; no defaulted
      message survives.
- [ ] `pnpm parity:api:extra --package actioncontroller` shows no new novel name.
