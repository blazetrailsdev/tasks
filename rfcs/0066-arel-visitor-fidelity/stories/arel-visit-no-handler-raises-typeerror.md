---
title: "Visitor#visit no-handler terminal should raise TypeError like Rails"
status: claimed
updated: 2026-07-20
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 12
pr: null
claim: "2026-07-20T19:06:45Z"
assignee: "arel-visit-no-handler-raises-typeerror"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Visitor#visit` (`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:27-43`)
has two distinct failure terminals, and trails collapses them into one.

Rails:

- A class that HAS a handler aliased to `unsupported` (String, Hash, Float,
  Date, Time, NilClass, … `to_sql.rb:832-845`) raises
  `UnsupportedVisitError` from `unsupported` (`to_sql.rb:828`).
- A class with NO handler at all falls into the `rescue NoMethodError`, walks
  `object.class.ancestors` for a responding handler, and if none is found
  raises **`TypeError, "Cannot visit #{object.class}"`** (`visitor.rb:38`).

Trails' `Visitor#visit` (`packages/arel/src/visitors/visitor.ts`) raises
`UnsupportedVisitError("Unknown node type: X")` for the second case, so the
no-handler terminal reports the wrong error class. The first terminal is
already faithful.

This predates PR #4990 (which converged raw-value dispatch into `visit` and
left both terminals as they were); #4990 makes the split visible because
arbitrary objects now reach `visit`'s terminal rather than `to-sql`'s
`unsupported`.

## Acceptance criteria

- [ ] The no-handler terminal in `Visitor#visit` raises `TypeError` with the
      message `Cannot visit <Class>`, mirroring `visitor.rb:38`.
- [ ] The `unsupported`-aliased classes keep raising `UnsupportedVisitError`
      (`to_sql.rb:828`) — the two terminals stay distinct.
- [ ] Callers/tests that currently expect `UnsupportedVisitError` for a truly
      unhandled class are updated; check `packages/arel/src/visitors/visitor.test.ts`
      and `to-sql.test.ts` ("unsupported input should raise UnsupportedVisitError").
- [ ] Confirm no ActiveRecord caller catches `UnsupportedVisitError` to control
      flow on the no-handler path before changing the class.
- [ ] api:compare / test:compare delta non-negative.
