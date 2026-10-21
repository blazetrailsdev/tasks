---
title: "No package outside ruby-compat imports Module or checks instanceof Module"
status: ready
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: retire
packages:
  [
    "activerecord",
    "activesupport",
    "actionpack",
    "actionview",
    "activemodel",
    "trailties",
    "activejob",
    "did-you-mean",
  ]
deps:
  - actionpack-module-super-inlined-into-includers
  - activemodel-activesupport-module-super-inlined-into-includers
  - activerecord-module-super-and-live-include-sites
  - actionview-module-super-remaining-modules
  - trailties-thor-and-test-help-remaining-modules
  - actionpack-route-set-helper-modules-without-live-include
  - live-include-module-sites-after-module-super-conversion
  - test-files-drop-ruby-compat-module
deps-rfc: []
est-loc: 300
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Apart from `new Module(...)`, packages outside ruby-compat import ruby-compat's `Module` as a type or for `instanceof Module` / `rbObjIsKindOf(_, Module)` checks. On origin/main (2026-10-21), files matching `import ... Module ... from "@blazetrails/ruby-compat"` or `instanceof Module`: activerecord 30, activesupport 24, actionpack 11, actionview 11, activemodel 5, trailties 2, activejob 1, did-you-mean 1.

Known ones: activesupport `class-attribute.ts`, `delegation.ts`, `code-generator.ts`, `module-ext.ts`, `rescuable.ts`; actionpack `abstract-controller/helpers.ts` (`rbObjIsKindOf(_, Module)`).

## Acceptance criteria

- No package outside ruby-compat imports `Module` from ruby-compat. A module check uses the RFC 0197 module mark (the `defineModule` stamp that `rbModConstSet` reads), or `rbObjIsKindOf` against `rbCModule`, whichever ruby-compat exposes.
- `git grep -nE '\binstanceof Module\b' -- packages ':!packages/ruby-compat'` is empty.
- Typecheck is green.
