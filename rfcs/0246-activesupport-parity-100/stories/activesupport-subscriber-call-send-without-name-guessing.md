---
title: "activesupport-subscriber-call-send-without-name-guessing"
status: claimed
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-20T20:58:47Z"
assignee: "activesupport-api-deprecation-modules-weakset-hashbuilder-supers"
blocked-by: null
closed-reason: null
---

## Context

Rails `Subscriber#call` / `#publish_event`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/subscriber.rb:136-144`)
are `method = event.name[0, event.name.index(".")]; send(method, event)`.

`packages/activesupport/lib/subscriber.ts`'s `call` / `publishEvent` differ in
three ways:

- They guess the TS spelling through a module-private `eventMethodCandidates`.
  It tries camelCase, `is…`/`…Q` predicate forms and the raw snake name, which
  is the name guessing root CLAUDE.md § "A dispatch by name is spelled
  directly" forbids.
- They return silently when the event name has no `.`, where Ruby raises
  (`String#[]` with a `nil` length).
- They skip the call when no candidate resolves, where Ruby's `send` raises
  `NoMethodError`.

`snakeCase` / `camelCase` there are invented helpers too. `methodAdded`
snake-cases the TS method name to build the pattern.

The event set is open (application subclasses define the handlers), so per
that section the send IS the ported method: `rbFSend(this, method, event)`,
with the event-name→method spelling decided once (the camelCase of the
event's leading segment), not guessed per call.

## Acceptance criteria

- [ ] `call` / `publishEvent` read `method` as Rails does and dispatch with one
      spelling rule. No candidate list.
- [ ] A missing `.` and an unanswered method raise, as Ruby does.
- [ ] `eventMethodCandidates`, `snakeCase` and `camelCase` are deleted, or
      reduced to the one casing translation, receipted.
- [ ] Subscriber / LogSubscriber tests across packages stay green.
