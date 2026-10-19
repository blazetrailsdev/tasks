---
title: "Gates: @inlinedFrom marks a module method's super inlined into an includer's method"
status: done
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: tooling
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9064
claim: "2026-10-19T13:54:10Z"
assignee: "inlined-from-admits-module-super-segments-on-methods"
blocked-by: null
closed-reason: null
---

## Context

This RFC § "Module `super` is inlined" widens RFC 0188's rule from
`initialize` to every module method that calls `super`. Today
`eslint/inlined-from-only-on-constructors.mjs` admits `@inlinedFrom` on a
constructor only, naming `Mod#initialize` or `Mod::ClassMethods#new`.
`scripts/api-compare/lint-inlined-from.ts` and the call gates pair tagged bodies
with constructors only.

## Acceptance criteria

- The lint admits `@inlinedFrom <Module>#<name> <citation>` on a method whose
  name matches, when the tagged module method's Rails body calls `super`.
- `parity:api` credits the module method through the tag.
- `parity:api:calls` and `parity:api:calls:args` compare the method against the
  union of its tagged bodies in tag order, with each `super` consumed by the
  next segment.
- `parity:api:inlined` checks staleness and autofixes the citation, as it
  does for constructors.
- arel's `inlined-from` bucket stays pinned at 0.
