---
title: "Array#to_xml's first.class.name against rbObjClass, which answers the class name"
status: in-progress
updated: 2026-09-25
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: 48
pr: trails#8071
claim: "2026-09-25T00:03:48Z"
assignee: "naming-enroll-activerecord"
blocked-by: null
closed-reason: null
---

## Context

Split from `naming-residue-burndown-activesupport-structural` by the LOC ceiling. One activesupport `burndown` naming row is in `array-utils.ts`:

- `toXml` `underscore`: Rails passes `first.class.name` (`vendor/rails/activesupport/lib/active_support/core_ext/array/conversions.rb:191`), recorded as `ref:name`. trails passes `rbObjClass(first)`, recorded as `ref:jsObjClass` (the `rb` → `js` token rename).

`rbObjClass` (`packages/ruby-compat/src/object.ts:17`) is documented as `rb_obj_class` (`vendor/ruby/object.c:296`), but it returns the class NAME string. So one TS call stands for Ruby's two-step `.class.name`. `first.constructor.name` is not a fix: it answers `Number` for `1` where Ruby answers `Integer`. That breaks `test_to_xml_with_non_hash_different_type_elements` (`vendor/rails/activesupport/test/core_ext/array/conversions_test.rb:130`).

There are two ways to converge, and choosing one is the work:

1. `rbObjClass` answers a class object whose `name` is the Ruby class name, and every caller that compares its result as a string is migrated.
2. The taxonomy (`scripts/api-compare/naming-taxonomy.ts`) learns that a Ruby `.class.name` chain is `rbObjClass`, the way `RUBY_COMPAT_EXPORTS` maps `Kernel#Float` to `kernelFloat`, and the row is receipted PERMANENT.

## Acceptance criteria

- [ ] The `array-utils.ts` `toXml` `underscore` row is matched, or it is classified permanent by a taxonomy arm with a test in `naming-taxonomy.test.ts`.
- [ ] No other package's rows are reclassified by the change without being listed in the PR.
