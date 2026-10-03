---
title: "bcrypt: BCrypt::Errors is a named module whose error classes are const_set under it"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
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

`vendor/bcrypt-ruby/v3.1.20/lib/bcrypt/error.rb:1-21` defines `module BCrypt::Errors`, and its
`InvalidSalt` / `InvalidHash` / `InvalidCost` / `InvalidSecret` are `class ... < BCrypt::Error`
nested in it, so `Module#name` answers `BCrypt::Errors::InvalidHash`.

`packages/bcrypt/src/error.ts` builds `Errors` as a plain object literal of anonymous-class
expressions. trails#8431 seats `Error`, `Errors`, `Engine` and `Password` on `BCrypt` through
`rbModConstSet` (`packages/bcrypt/src/index.ts`), which paths the classes (`BCrypt::Password`).
`Errors` has no `name`, though, and its classes are not `const_set` under it, so
`rbModName(Errors.InvalidHash)` is `"InvalidHash"` and not Ruby's `"BCrypt::Errors::InvalidHash"`.

## Acceptance criteria

- [ ] `Errors` is a named module object (`{ name: "BCrypt::Errors" }` seated by `rbModConstSet(BCrypt, "Errors", Errors)`) and each error class is seated with `rbModConstSet(Errors, "<Name>", <Class>)`, as `error.rb:6-19` nests them.
- [ ] `rbModName(Errors.InvalidHash) === "BCrypt::Errors::InvalidHash"`, asserted in a `.trails.test.ts`.
