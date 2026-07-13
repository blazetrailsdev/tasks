---
title: "Mass-assignment empty-bag guard should delegate to wrapper empty?, not Object.keys"
status: claimed
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-13T18:18:25Z"
assignee: "mass-assignment-empty-bag-delegates-to-wrapper-empty"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4786 (model-construction-sanitize-forbidden-attributes).

The mass-assignment empty-bag guard gates on `Object.keys(attrs).length` rather
than delegating to a wrapper's `empty?`. Rails `assign_attributes`
(`activemodel/lib/active_model/attribute_assignment.rb:32`) does
`return if new_attributes.empty?`, and `ActionController::Parameters` delegates
`empty?` to its private `@parameters`
(`actionpack/lib/action_controller/metal/strong_parameters.rb:250`).

Trails uses `Object.keys(attrs).length` in three shared entry points:

- `Model` constructor — `packages/activemodel/src/model.ts` (`if (Object.keys(attrs).length > 0)`)
- `Model#assignAttributes` — `packages/activemodel/src/model.ts` (`if (Object.keys(attrs).length === 0) return`)
- AR `Base` constructor — `packages/activerecord/src/base.ts:3063`

For a real `Parameters` wrapper (or any params-like object storing its data in
private fields), `Object.keys` returns the wrapper's own instance fields
(e.g. `parameters`, `_permitted`), NOT its parameter count. So an EMPTY
unpermitted `Parameters` reads as non-empty and proceeds into
`sanitizeForMassAssignment` instead of being a no-op, and a NON-empty wrapper's
key count is likewise wrong. Rails' `empty?` delegation avoids this.

Pre-existing convention (not introduced by #4786). Closely related to
`sanitize-mass-assignment-permitted-getter` — both concern real `Parameters`
wrapper recognition on the mass-assignment path — but distinct (that story is
the `permitted` getter-vs-method detection; this is the empty-check delegation).

## Acceptance criteria

- [ ] The mass-assignment empty-bag guard delegates to a params-like wrapper's
      `empty?`/parameter count when present, rather than counting the wrapper's
      own `Object.keys`.
- [ ] An empty unpermitted `Parameters` passed to construction / `assignAttributes`
      is a no-op (no `ForbiddenAttributesError`), matching `return if new_attributes.empty?`.
- [ ] Plain-hash behavior is unchanged.
- [ ] Shared across the `Model` constructor, `Model#assignAttributes`, and AR
      `Base` constructor (one helper, not three divergent checks).
- [ ] Test covers empty and non-empty real `Parameters`.
