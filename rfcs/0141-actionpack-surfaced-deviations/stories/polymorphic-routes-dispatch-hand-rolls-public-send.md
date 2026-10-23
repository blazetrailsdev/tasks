---
title: "HelperMethodBuilder's handle_string/class/model_call hand-roll public_send"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HelperMethodBuilder#polymorphic_method` now ends in `rbFPublicSend(target, method, ...)`
(`packages/actionpack/src/action-dispatch/routing/polymorphic-routes.ts:266-268`), as
`polymorphic_routes.rb:239-243` does, and the invented `undefined route helper`
`ArgumentError` is gone. Three sites still hand-roll the dispatch:

- `handle_string_call` / `handle_class_call` / `handle_model_call`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb:258-289`)
  are `target.public_send(...)`. trails does `(target[m] as …).call(target, …)`
  (`polymorphic-routes.ts:288`, `:297`, `:313`), so a missing helper is a JS `TypeError`
  rather than `NoMethodError`, and a receiver's `method_missing` is never reached.

The dispatched name is a named-route helper (`"#{prefix}#{name}_#{suffix}"`), and the set of
route helpers is drawn by application code, so this is CLAUDE.md § "A dispatch by name is
spelled directly"'s third arm (caller-supplied name from an open set): the send IS the port
here, as `polymorphic_method` already shows.

## Acceptance criteria

- The three sites dispatch through `rbFPublicSend(target, method, ...args)`.
- A missing helper raises `NoMethodError`, and `polymorphic-routes.test.ts` asserts it.
