---
title: "rack-request-env-ported-as-its-own-module"
status: draft
updated: 2026-10-20
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request::Env` is its own module (`vendor/rack/v3.1.14/lib/rack/request.rb:82-...`), with `attr_reader :env`, `initialize(env)` (sets `@env`, then `super()`), and the header readers. `Rack::Request` gets it through `Helpers`/`Env` includes. trails folds Env's members into `Request` in `packages/rack/src/request.ts`, and exports no `Env` module.

So `spec_request.rb:1903-1909` ("Env sets @env on initialization"), which builds `Class.new { include Rack::Request::Env }` and checks `c.new(h).env.must_be_same_as h`, can only be ported against a full `Request` (`packages/rack/src/request.test.ts`). It does not test Env in isolation. Raised in review on trails#9146.

## Acceptance criteria

- [ ] `Rack::Request::Env` is ported as a module in `packages/rack/src/request.ts`, with its `initialize` inlined into each includer's constructor per CLAUDE.md § "A module's `initialize` is inlined into the constructor".
- [ ] "Env sets @env on initialization" builds a bare class that includes only `Env`, as in Rails.
