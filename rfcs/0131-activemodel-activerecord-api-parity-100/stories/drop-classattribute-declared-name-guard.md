---
title: "drop-classattribute-declared-name-guard"
status: done
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 6
pr: 7446
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: null
closed-reason: null
---

## Context

`credit-classattribute-generated-accessors` (#7405) taught `extract-ts-api.ts`
to credit the accessors `classAttribute()` installs, mirroring
`extract-ruby-api.rb#process_mattr` (`:1494-1537`). It carries one guard Ruby's
arm does not: a name is credited only when some entity in the same file already
declares it (`extract-ts-api.ts`, the `declared` set in the classAttribute
pass). Ruby credits every `class_attribute` name unconditionally.

The guard is there because a credited name with no declaration anywhere in the
file has no Rails counterpart to match either, so it lands as NOVEL extra
surface — and `parity:api:extra:gate` is only-shrink for activerecord and
pinned at 0 novel for arel and ruby-compat, so a run that adds one turns the
gate red with no sanctioned remedy. It is a measurement artefact, not a
semantic difference: the accessor exists at runtime whether or not a host
interface happens to type it.

Ruby side: `activesupport/lib/active_support/core_ext/class/attribute.rb:80`,
credited by `scripts/api-compare/extract-ruby-api.rb:1494-1537`.

## Acceptance criteria

- The `declared` guard is gone; a `classAttribute` call credits its accessor on
  the resolved class/module the way `process_mattr` does, regardless of whether
  the file also declares the name.
- Every name that newly enters the measured surface either matches a Ruby
  counterpart or carries a `@noRailsEquivalent PERMANENT|CONVERGEABLE
<story-id>` receipt at its declaration — no mark is raised, and
  `pnpm parity:api:extra:gate` is green.
- No package total falls; marks move only via `:tighten`.
- The negative test for a non-literal attribute name and for an unresolvable
  receiver stays green (`scripts/api-compare/extract-ts-api.test.ts`).
