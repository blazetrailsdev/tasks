---
title: "class-body-macro-statements"
status: done
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - codegen-golden-output-snapshots
deps-rfc: []
est-loc: 200
priority: 6
pr: 6111
claim: "2026-08-05T01:44:55Z"
assignee: "i18n-date-calendar-reform-start-argument"
blocked-by: null
closed-reason: null
---

## Context

Toward 100% node coverage. base.rb sits at 17.1% (0 defs) because
classMembers (handlers/structure.ts) silently skips-and-counts every
non-def construct in a class body — base.rb is one big macro DSL block
(`include Persistence`, `extend ClassMethods`, ...). Decided image: class
body macro statements emit AFTER the class declaration as statements with
self bound to the class (`Base.include(Persistence)` style — matches how
the port wires modules at composition points). Same convention unlocks
class-body constants and attr macros in inheritance.rb/core.rb.

## Acceptance criteria

- Class-body non-def statements emit post-class with class-self receiver
  resolution; base.rb coverage moves from 17% to near-100 and gains its
  defs in the clean denominator.
- 0 parse errors invariant holds; tests for macro emission and class-self.
