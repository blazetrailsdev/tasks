---
title: "exist_fragment? keeps its ? because Subscriber#call cannot dispatch the conventions spelling"
status: ready
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::LogSubscriber` gets an `exist_fragment?` method from the
`class_eval` loop at
`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:77-88`, and
`subscribe_log_level :exist_fragment?, :info` registers it under the event name
`exist_fragment?.action_controller`.

PR #7501 ported it as a quoted member literally named `"existFragment?"`
(`packages/actionpack/src/action-controller/log-subscriber.ts`), which is NOT
the spelling `docs/ruby-ts-conventions.md` produces for a Ruby predicate —
that table maps `exist_fragment?` onto `isExistFragment` (or the `Q`
fallbacks).

The `?` was kept because the dispatcher forces it. `Subscriber#call` and
`Subscriber#publishEvent`
(`packages/activesupport/src/subscriber.ts`) take the event name up to the
first `.`, camelCase it, and invoke the member of exactly that name:
`camelCase("exist_fragment?")` is `"existFragment?"`, and the snake fallback is
`"exist_fragment?"`. Neither is `isExistFragment`, so a conventions-spelled
member would silently never be called — the subscriber would register a level
for a method that never fires. `EnvironmentInquirer`'s `"local?"`
(`packages/activesupport/src/environment-inquirer.ts`) is the existing
precedent for a quoted `?` member in the repo.

## Converged shape

The dispatcher resolves a Ruby predicate event onto the conventions-table
spelling, so the member can be named `isExistFragment` (or whichever spelling
`scripts/parity/conventions.ts` produces) and still fire — or, if the quoted
`?` is the right answer repo-wide, `SKIP_GROUPS` / the conventions table
records it so the spelling is sanctioned rather than silently divergent.
Either way the outcome is a name whose spelling is derivable from the table
rather than from the dispatcher's implementation detail.

## Acceptance criteria

- `exist_fragment?.action_controller` still reaches its handler, asserted by a
  test.
- The member's name is the one `docs/ruby-ts-conventions.md` produces from
  `exist_fragment?`, or the deviation is recorded in
  `scripts/parity/conventions.ts` with its reason.
- `pnpm parity:api` for actioncontroller is non-negative.
