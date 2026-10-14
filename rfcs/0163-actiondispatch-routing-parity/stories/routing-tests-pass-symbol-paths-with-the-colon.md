---
title: "Routing tests pass Rails' Symbol paths with the colon so they take map_match's Symbol arm"
status: done
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8892
claim: "2026-10-14T11:42:29Z"
assignee: "dirty-getters-with-side-effects-exclusion-has-no-receipt"
blocked-by: null
closed-reason: null
---

## Context

`map_match`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1990-2003`)
sends a Symbol path down its own arm: the Symbol is the action, and the route's
path comes from `:path` or `action_path`. trails#8875 ported that arm; a Symbol
path keeps its colon (`this.put(":close", { on: "member" })`).

Tests ported before that spell a Rails Symbol path as a bare string, so they
take the String arm. `routing_test.rb` draws `get :archive, on: :collection`
and `post :preview, on: :member`; `routing.test.ts` has
`this.get("archive", { on: "collection" })` and
`this.post("preview", { on: "member" })`. The two arms differ for a canonical
action name, for a scope with `path_names`, and when `path:` is given. `on:` is
a Symbol in Rails too (`mapper.rb:1967`, `VALID_ON_OPTIONS`) and is spelled
bare.

## Acceptance criteria

- [ ] Every draw in actionpack's tests that mirrors a Rails Symbol path passes
      the colon spelling, so it takes `map_match`'s Symbol arm.
- [ ] `on:` is spelled the way the Symbol rule in the root CLAUDE.md gives, or
      its bare spelling is recorded as following `symbolize_keys`-style option
      values.
