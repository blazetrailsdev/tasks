---
title: "ActionDispatch::Response#to_a / prepare! replace toRack"
status: draft
updated: 2026-10-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8507. `ActionController::Metal#to_a` is `response.to_a`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb:280-282`), and
`ActionDispatch::Response#to_a` is defined with `alias prepare! to_a`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:410-414`).

trails' `Response` spells it `toRack()`
(`packages/actionpack/src/action-dispatch/http/response.ts`), so `Metal#toA`
(`packages/actionpack/src/action-controller/metal.ts`) calls `this.response.toRack()`.

## Acceptance criteria

- `Response#toA` exists with Rails' body and `prepareBang` is its alias; `toRack`
  is gone and every caller (4 non-test sites at the time of filing) uses `toA`.
- `Metal#toA` is `this.response.toA()`.
