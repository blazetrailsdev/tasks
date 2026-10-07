---
title: "rails-error-parity passes a ported class raised with an invented message where Rails raises it bare"
status: in-progress
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8612
claim: "2026-10-07T02:03:10Z"
assignee: "connection-adapters-resolve-answers-a-promise-for-an-unloaded-adapter"
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-error-parity` (`eslint/rails-error-parity.mjs`) keys only on the constructor of a `throw new X(...)`: any ported class passes. So a site that raises the right class with an invented message is invisible to it. trails#8599 retired the rows for `encryption/message-serializer.ts` and `encryption/message-pack-message-serializer.ts` with the lint green while both still threw `new ForbiddenClass(...)` with a "Can only serialize Message instances, got ..." message built from `typeof message`, where Rails raises the bare class (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/message_serializer.rb:32`, `message_pack_message_serializer.rb:23`). A reviewer caught it by hand.

CLAUDE.md § "Errors" requires same class, same message string, same raise site; only the class is gated.

## Acceptance criteria

- [ ] A report (script or lint arm) lists every `throw new <PortedClass>(<message>)` in a Rails-matched file whose Rails method body raises that class bare (`raise Klass` / `raise Klass unless …`) with no message argument.
- [ ] Each hit in activerecord is converged to the bare raise, or filed as its own story with the Rails `file:line`.
- [ ] The check is wired as an only-shrink gate, starting from zero if the burndown fits in the same PR.
