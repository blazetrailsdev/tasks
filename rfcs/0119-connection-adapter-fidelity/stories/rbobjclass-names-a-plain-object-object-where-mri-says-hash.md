---
title: "rbobjclass-names-a-plain-object-object-where-mri-says-hash"
status: draft
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjClass` (`packages/ruby-compat/src/object.ts:16`, Ruby `rb_obj_class`,
`vendor/ruby/object.c:296`) answers a plain JS object's constructor name,
`"Object"`. trails models a Ruby Hash as a plain object (`rbInspect`'s
`isPlainHash` arm already renders one as a Hash), so MRI's
`Float({})` → `can't convert Hash into Float` comes out in trails as
`can't convert Object into Float` (`kernel-float.ts:43` via
`rbBuiltinClassName`).

Surfaced when i18n's private `sprintf` collapsed onto `Kernel#sprintf`
(story `i18n-private-sprintf-duplicates-kernel-sprintf`): the private helper
mapped `Object` → `Hash`, and `packages/i18n/src/interpolate/ruby.trails.test.ts`
now pins the `Object` message instead. Mapping it inside `rbObjClass` reds
`kernel-integer` / `kernel-float` tests that use plain objects as stand-ins
for arbitrary objects, and `rbObjClass` has callers in actionpack,
activesupport, rack and rack-test, so it needs its own change.

## Acceptance criteria

- [ ] `rbObjClass` answers `"Hash"` for a plain (Object- or null-prototype)
      object, matching `isPlainHash`.
- [ ] ruby-compat tests that used a plain object as a non-Hash stand-in use a
      class instance instead.
- [ ] `ruby.trails.test.ts`'s `{}` assertion goes back to
      `can't convert Hash into Float`.
- [ ] Every other caller's suite is green.
