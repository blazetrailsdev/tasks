---
title: "Retire the three remaining private Ruby inspect/to_s copies onto core-ext/object/inspect"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6571 (story `port-object-inspect-and-retire-private-to-s-copies`) ported
Ruby's `Object#inspect` / `Object#to_s` to
`packages/activesupport/src/core-ext/object/inspect.ts` and retired the two
private copies its acceptance criteria named (`xml-mini.ts`, `array-utils.ts`).

While filing that work, three MORE partial copies of the same Ruby semantics
turned up, none of them in that story's scope:

- `packages/activerecord/src/relation/ruby-inspect.ts` — `rubyInspect` /
  `rubyInspectHash`, used by `Relation#_renderExplainBinds` and
  `Migration#formatArguments`.
- `packages/arel/src/visitors/to-sql.ts` — `rubyToS` / `rubyInspect` /
  `rubyStringInspect` (added by #4974; the most complete escaping of the set,
  verified byte-identical against MRI across 21 adversarial inputs).
- `packages/actionpack/src/action-dispatch/journey/formatter.ts:328-343` —
  `rubyInspectHash` / `rubyInspectArray` / `rubyInspect`, which escapes nothing
  inside strings.

They disagree: the new activesupport port renders a Ruby Symbol key as `:b` and
a String key as `"b"` (the CLAUDE.md colon convention, MRI-verified), while
`ruby-inspect.ts` always emits the symbol form, and the arel copy has escaping
the other three lack.

## The prior decision this has to clear first

`consolidate-ruby-inspect-to-s-helpers` (0023, **closed**) proposed exactly this
consolidation and was closed as "Not Rails-convergent: extracting a shared Ruby
inspect/to_s helper into activesupport is an abstraction Rails does not have
(Ruby gets it from Object#inspect)."

What changed: that helper now EXISTS, at its Rails-facing location, put there by
a maintainer-authored story (RFC 0101). So this story is no longer "create an
abstraction Rails lacks" — it is "delete duplicates of a port that already
shipped", the same second half as
`port-object-blank-to-core-ext-and-retire-private-copies`. **Triage should
confirm that reading before this is picked up**; if the closure still stands,
block this rather than converging it.

## Converged shape

Retire the copies onto `activesupport/src/core-ext/object/inspect.ts`, folding
the arel copy's string escaping into the port first (it is the only one that
matches MRI on control characters, `\uXXXX`, and `\#`), so consolidation raises
fidelity instead of lowering it. Take one call site at a time — the four
sites have different Symbol-vs-String key expectations and cannot be swapped
blind.

Two known gaps in the shared port to fix while there, both currently documented
in its JSDoc rather than implemented, and both already described for the
activerecord copy by `ruby-inspect-object-fallback-and-hash-key-fidelity`:

- The default arm is `to_s`, not Ruby's `#<Foo:0x… @a=1>`.
- Hash-key rendering depends on the colon convention being applied at the call
  site.

## Acceptance criteria

- [ ] One Ruby `inspect`/`to_s` implementation; `ruby-inspect.ts`,
      `to-sql.ts` and `journey/formatter.ts` hold no private copy.
- [ ] The surviving port carries the arel copy's escaping, still byte-identical
      to MRI on #4974's 21 adversarial inputs.
- [ ] Each retired call site keeps its current rendering, asserted against
      `ruby -e` output.
