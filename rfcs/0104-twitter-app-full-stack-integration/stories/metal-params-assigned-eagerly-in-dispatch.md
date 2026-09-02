---
title: "Metal#dispatch assigns params eagerly; Rails memoizes them lazily in #params"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Metal#params` is lazy
(`vendor/rails/actionpack/lib/action_controller/metal.rb:219-221`):

```ruby
def params
  @_params ||= request.parameters
end
```

`dispatch` does not mention it (`metal.rb:249-255`):

```ruby
def dispatch(name, request, response)
  set_request!(request)
  set_response!(response)
  process(name)
  request.commit_flash
  to_a
end
```

trails' `Metal#dispatch`
(`packages/actionpack/src/action-controller/metal.ts:196-206`) assigns it
eagerly, and wraps it on the way in:

```ts
const reqParams = request.parameters;
this.params = reqParams instanceof Parameters ? reqParams : new Parameters(reqParams);
```

Two consequences. Every dispatch pays `request.parameters` — the full
query + body parse — even for an action that never reads `params`, where Rails
pays nothing. And a caller that assigned `params=` before dispatch
(`metal.rb:223-225`) has it overwritten, where Rails' `||=` would keep it.

Surfaced during #7376, which converged the rest of `dispatch` onto
`metal.rb:249-255` and left this line as the only statement Rails does not
have.

## Converged shape

Delete the two lines from `dispatch`, and make `params` the memoized reader
`metal.rb:219-221` describes, with the `Parameters` wrap moved into it (or into
`Request#parameters`, if that is where the wrap belongs — check which side
Rails' `request.parameters` already returns wrapped).

## Acceptance criteria

- `Metal#dispatch` is `set_request!` / `set_response!` / `process` /
  `commit_flash` / `to_a` and nothing else (`metal.rb:249-255`).
- `Metal#params` memoizes `request.parameters` on first read
  (`metal.rb:219-221`).
- A `params=` assignment made before `dispatch` survives it
  (`metal.rb:223-225`).
