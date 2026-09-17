---
title: "Port MRI initialize attributes for KeyError, NoMethodError, FrozenError"
status: ready
updated: 2026-09-16
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by review of trails#7771. MRI defines specialized `initialize` methods and readers that the ruby-compat ports never carried:

- `KeyError#initialize(msg, receiver:, key:)`, `#receiver`, `#key` (`vendor/ruby/error.c:3325-3328`), which `rb_key_err_raise` sets (`vendor/ruby/hash.c:2203`). Port: `packages/ruby-compat/src/key-error.ts`.
- `NoMethodError#initialize(msg, name, args, receiver:)`, `#args`, `#private_call?` (`vendor/ruby/error.c:3360-3363`). Port: `packages/ruby-compat/src/no-method-error.ts`.
- `FrozenError#initialize(msg, receiver:)`, `#receiver` (`vendor/ruby/error.c:3366-3368`). Port: `packages/ruby-compat/src/frozen-error.ts`.

The converged shape is a constructor plus reader per class, mirroring the C argument order and keyword arguments. Keep `name` / default `message` on the prototype, as done in trails#7771.

## Acceptance criteria

- [ ] Each of the three classes accepts and exposes the MRI attributes with MRI's parameter names and order.
- [ ] Raise sites that have the receiver/key in hand (e.g. `Hash#fetch` ports, `rb_check_frozen` ports) pass them.
- [ ] `parity:api:extra:gate` stays green, with each constructor backed by its `error.c` definition.
