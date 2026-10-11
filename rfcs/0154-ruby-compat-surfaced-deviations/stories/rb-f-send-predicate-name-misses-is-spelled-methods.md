---
title: "ruby-compat: rbFSend of a predicate by its Ruby name misses a method spelled is…"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced landing trails#8796.

`sendInternal` in `packages/ruby-compat/src/object.ts` computes `predicate`, the `is…` spelling of a method id ending in `?` (`const predicate = mid.endsWith("?") ? camelized(...)`), and uses it for only two lookups: the `isOdd` / `isEven` arm and `OBJECT_METHOD_TABLE`. The prototype walk, and the core class seat walk added by trails#8796, look up the raw `mid`.

So a predicate sent by its Ruby name reaches a method only when it lives in one of those two tables:

- `rbFSend(5, "isInteger")` is `true` (`Integer#integer?`, `vendor/ruby/v3.3.11/numeric.rb:178`, seated on `rbCInteger`), and `rbFSend(5, "integer?")` raises `NoMethodError: undefined method 'integer?' for an instance of Integer`.
- The same holds for any class that defines `isFoo()`: `rbFSend(obj, "foo?")` misses it and falls to `methodMissing` or raises.

Ruby's `send(:integer?)` is one lookup by name (`vm_eval.c` `send_internal`), and Rails sends predicates by their Ruby name: `NUMBER_CHECKS` in `vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:16` holds `:odd?` and `:even?`, which is why the `isOdd` / `isEven` arm exists at all.

## Acceptance criteria

- `rbFSend(recv, "foo?")` finds a method the receiver's prototype chain or core class seat defines as `isFoo`, by the same walk `"isFoo"` takes; `basicObjRespondTo(recv, "foo?")` answers the same.
- `rbFSend(5, "integer?")` is `true` and `rbFSend(5.5, "integer?")` is `false`, with tests in `object.trails.test.ts`.
- A name that is defined under its raw spelling still wins over the `is…` spelling, and the `isOdd` / `isEven` arm is dropped if the general walk now covers it.
- ruby-compat extra-surface gate green.
