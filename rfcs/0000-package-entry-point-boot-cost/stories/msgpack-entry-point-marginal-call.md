---
title: "msgpack: decide whether its entry point is worth changing at all (21 modules over 6 call sites)"
status: draft
updated: 2026-10-13
rfc: "0000-package-entry-point-boot-cost"
cluster: "measurement"
packages: ["msgpack"]
deps: ["boot-graph-measurement-harness"]
deps-rfc: []
est-loc: 40
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Measured:

| Specifier                       | Modules | Time  |
| ------------------------------- | ------- | ----- |
| `@blazetrails/msgpack`          | 162     | 198ms |
| `@blazetrails/msgpack/core-ext` | 141     | 150ms |

21 modules and ~48ms, across **6** barrel call sites. The package ships 27
files, so **141 of those 162 modules belong to other packages** — msgpack's
weight is its dependency on ruby-compat and activesupport, not its own entry
point.

This story is deliberately framed as a decision, not an implementation: it is
expected to be worth little once the ruby-compat migration lands, because most
of the 141 is exactly what that work removes.

## Acceptance criteria

- [ ] Re-measure after the ruby-compat tail story lands
- [ ] Either migrate the 6 call sites, or close this story with the measured
      numbers recorded as the reason

## Definition of done

Closing this as not-worth-it **is** a valid outcome, provided the post-migration
measurement is recorded. Guessing without re-measuring is not.
