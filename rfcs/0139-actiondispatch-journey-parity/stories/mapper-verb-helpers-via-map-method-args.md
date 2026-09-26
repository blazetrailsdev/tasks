---
title: "Mapper verb helpers forward *args through map_method (hash form, multi-path)"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' HTTP verb helpers are `def get(*args, &block); map_method(:get, args, &block); end`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:710-712`, and the same
for `post` / `patch` / `put` / `delete` / `options` / `connect`). `map_method`
(`mapper.rb:760-765`) does `options = args.extract_options!; options[:via] = method;
match(*args, options, &block); self`.

trails' verbs (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, `get(path,
optionsOrEndpoint)` at ~:547 onward) take a fixed `(path, optionsOrEndpoint)` pair and a
`mapMethod(method, path, options)`. So:

- `get({ "/foo": "c#a" })` — Rails' `get "/foo" => "c#a"` — is unreachable: `extract_options!`
  pops the hash, `match(options)` then takes the hash-form arm that #8161 ported.
- `get("/a", "/b", { to: ... })` — the multi-path form — is unreachable.
- `mapMethod` does not return `self`.

## Acceptance criteria

- The verb helpers take `(...args)` and forward to `mapMethod(method, args)`, which mirrors
  `map_method`: `extractOptions` (activesupport's `extract_options!`), set `via`, call
  `this.match(...args, options)`, return `this`.
- `get({ "/foo": "posts#index" })` draws the route through `match`'s hash arm (colon-keyed
  Symbols, per #8161).
- trails' `optionsOrEndpoint` string shorthand is converged away or shown to be reachable through
  the Rails shape.
- parity:api:params stays green.
