---
title: "walkConstants walks plain-object modules, not only classes"
status: draft
updated: 2026-11-12
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`constantResidue` (`scripts/api-compare/class-paths.ts:640-658`) records as
`unwalked` every table row that `walkConstants` does not reach but whose path
`derivedConstantPath` derives. Its doc comment (`:626-630`) names the two such
shapes: a static member and a module object. `walkConstants` walks exported
classes only, so a plain-object module, the first shape CLAUDE.md
§ "A Ruby module is a JS object or a JS class" prescribes, always lands there:
`i18n` `locale.ts::Locale`, and since trails#10027
`backend/transliterator.ts::Transliterator` (`I18n::Backend::Transliterator`,
`vendor/i18n/v1.14.8/lib/i18n/backend/transliterator.rb`).

## Acceptance criteria

- `walkConstants` walks an exported plain-object module (a `const` whose value
  is an object literal, or `Object.defineProperties` over one, and that a
  namespace seats) the way it walks an exported class, deriving its Ruby path
  from the seat.
- The `unwalked` rows for plain-object modules leave `constant-residue.json`
  (re-record with `pnpm exec tsx scripts/api-compare/class-paths.ts --check --record`),
  including i18n's `Transliterator` and `Locale`.
- `class-paths.ts --check` stays green.
