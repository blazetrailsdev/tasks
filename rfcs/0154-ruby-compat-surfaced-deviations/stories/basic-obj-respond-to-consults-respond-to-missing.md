---
title: "basicObjRespondTo skips basic_obj_respond_to_missing (vm_method.c:2873)"
status: draft
updated: 2026-09-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `broadcast-logger-method-missing-dup-and-kwargs` (trails#8045).

MRI's `basic_obj_respond_to` (`vendor/ruby/vm_method.c:2864-2879`) has three
arms: a method entry that is undefined (`case 2` → false), NO method entry
(`case 0` → `basic_obj_respond_to_missing`, `vm_method.c:2850`, which calls the
receiver's `respond_to_missing?`), and a found method (true).

trails' `basicObjRespondTo` (`packages/ruby-compat/src/object.ts`) ports the
first and third arms but returns `false` for the second, so it never consults
`respondToMissing`. Consequence: `rbObjRespondTo(broadcastLogger, "foo")` is
`false` where Ruby's `broadcast_logger.respond_to?(:foo)` is true via
`respond_to_missing?` (`activesupport/lib/active_support/broadcast_logger.rb:247-249`).
The same holds for every class whose port defines `respondToMissing`.

## Acceptance criteria

- [ ] `basicObjRespondTo`'s no-entry arm calls the receiver's `respondToMissing(mid, !pub)`
      when one is defined and answers `rtest(ret)`, per `vm_method.c:2873-2875`.
- [ ] A test: `rbObjRespondTo(new BroadcastLogger(loggerWithFoo), "foo")` is true.
- [ ] Callers that relied on the old `false` are checked (grep `respondToMissing` definers).
