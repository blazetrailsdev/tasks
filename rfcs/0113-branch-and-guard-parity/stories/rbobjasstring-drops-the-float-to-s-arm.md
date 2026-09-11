---
title: 'rbObjAsString and rbInspect drop Float#to_s, so 1.0 renders as "1"'
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 63
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Float#to_s` (`vendor/ruby/numeric.c:1569` `flo_to_s`) always renders a
decimal point: `1.0.to_s` is `"1.0"`, never `"1"`. `rb_obj_as_string`
(`vendor/ruby/string.c:1653`) and `rb_inspect` (`vendor/ruby/object.c:704`)
both route a Float through it.

trails' ports of those two — `rbObjAsString` and `rbInspect`
(`packages/ruby-compat/src/object.ts:188,106`, the latter through
`inspectValue`'s `typeof value === "number"` arm) — hand every number to JS
`String(x)`, which drops the point: `String(1.0)` is `"1"`.

Surfaced by `kernel-format-is-not-ported` (#7637): the MRI-differential suite
matches on every one of ~4700 randomised cases EXCEPT `format("%s", 1.0)` and
`format("%p", 1.0)`, where MRI answers `"1.0"` and trails answers `"1"`. It is
not a `format` bug — `formatS` calls the right two functions — so it was left
out of that PR's table rather than papered over.

JS has one numeric type where Ruby has Integer and Float, so a `number` that
`Number.isInteger` is genuinely ambiguous at the call site. That is what the
story has to settle: which arm a whole-valued `number` takes, and whether a
Float seat needs marking (the `bigint` half is unambiguous — it is always an
Integer, and always renders without a point).

## Acceptance criteria

- [ ] `rbObjAsString` and `rbInspect` render a Float with `Float#to_s`
      semantics (`vendor/ruby/numeric.c:1569`), including the `Infinity` /
      `-Infinity` / `NaN` spellings and the exponent form Ruby switches to
      outside `1e-4 .. 1e16`.
- [ ] The chosen answer for a whole-valued JS `number` is stated in the JSDoc
      with its reasoning, since it is a language-shortcoming call, not a
      preference.
- [ ] The two rows this unblocks are added to
      `packages/ruby-compat/src/kernel-format.trails.test.ts`:
      `format("%s", 1.0) == "1.0"` and `format("%p", 1.0) == "1.0"`.
- [ ] Callers that depended on the point-less rendering are converged, not
      excepted; `pnpm parity:api:calls` and the AR lanes stay green.
