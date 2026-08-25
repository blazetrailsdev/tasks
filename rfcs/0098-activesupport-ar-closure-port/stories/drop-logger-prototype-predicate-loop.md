---
title: "Delete the Logger.prototype predicate loop that shadows the quoted-literal getters"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6541
claim: "2026-08-14T20:15:09Z"
assignee: "sqlite3-internal-exec-query-delegates-to-raw-execute"
blocked-by: null
closed-reason: null
---

# Delete the `Logger.prototype` predicate loop that shadows the quoted-literal getters

## Context

`packages/activesupport/src/logger.ts` defines each severity predicate TWICE:

- the faithful port, `get "debug?"` / `"info?"` / `"warn?"` / `"error?"` /
  `"fatal?"` on the class body (the shape `Logger#debug?` has in
  ruby/logger's `lib/logger.rb`, and the one
  `vendor/rails/activesupport/lib/active_support/broadcast_logger.rb:167-213`
  delegates to); and
- a `forEach` at the bottom of the file that calls
  `Object.defineProperty` on `Logger.prototype` for the same five names,
  keyed by a template literal, under the comment "Add convenience predicate
  methods".

The loop's descriptors overwrite the class-body getters at module-eval time, so
the literal getters a reader sees in the class are dead: every `logger["debug?"]`
call in the tree runs the loop's copy. Rails has no such loop — `logger.rb`
writes each predicate out, and the five bodies are already written out here.

Surfaced while retiring the `*Enabled` aliases (PR #6535,
`retire-logger-enabled-predicate-aliases`), which removed the OTHER duplicate
spelling of the same five predicates. This is the remaining one.

## Converged shape

Delete the `forEach` block; keep the five class-body getters. Check first
whether anything depends on the descriptors being own-configurable properties
of `Logger.prototype` (a spy or a subclass redefinition in the suite) — a
class-body getter is already on the prototype, so the difference is only in
`configurable`/`enumerable`.

## Acceptance criteria

- [ ] The `forEach` / `Object.defineProperty` block is gone from `logger.ts`.
- [ ] `logger["debug?"]` still reads the class-body getter on `Logger`,
      `NullLogger` and any other subclass.
- [ ] `pnpm parity:api:extra --package activesupport` non-negative.
