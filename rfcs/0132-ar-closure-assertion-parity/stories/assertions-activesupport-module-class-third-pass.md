---
title: "assertions-activesupport-module-class-third-pass"
status: ready
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: ["activesupport"]
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

Remainder of `assertions-activesupport-module-class-remainder`. That PR
converged `core_ext/secure_random_test.rb`, `core_ext/digest/uuid_test.rb`,
`core_ext/class_test.rb` and `core_ext/module/anonymous_test.rb` (all 0/0/0).
Still outstanding, measured 2026-09-16 with
`pnpm parity:test -- --assertions --missing --package activesupport` against
`vendor/rails/activesupport/test/`:

- `core_ext/module_test.rb` — delegation tests
- `concern_test.rb`
- `core_ext/module/attribute_accessor_per_thread_test.rb`
- `core_ext/module/attribute_accessor_test.rb`
- `core_ext/module/introspection_test.rb`
- `core_ext/class/attribute_test.rb` — `assert_not_respond_to` + `assert_raises(NoMethodError)` arms
- `core_ext/module/attr_internal_test.rb` — `assert_nothing_raised` / `assert_not` shapes
- `core_ext/module/concerning_test.rb` — `assert_respond_to` on `class_methods` blocks
- `core_ext/file_test.rb` — `File.atomic_write` (`core_ext/file/atomic.rb`)
- `core_ext/kernel_test.rb` — `silence_warnings` / `enable_warnings` / `class_eval` are unported; the trails test exercises `console.warn` instead
- `core_ext/module/remove_method_test.rb` — `remove_possible_method`, `remove_possible_singleton_method`, `redefine_method` (`core_ext/module/remove_method.rb`) unported; the trails test deletes prototype properties
- `core_ext/module/attribute_aliasing_test.rb` — `alias_attribute` (`core_ext/module/aliasing.rb`) unported; the trails test hand-writes accessors
- `core_ext/name_error_test.rb`, `core_ext/load_error_test.rb`, `descendants_tracker_test.rb` (`assert_equal_sets` is unmapped)
- `core_ext/object/deep_dup_test.rb` "anonymous modules are duped", `core_ext/object/duplicable_test.rb`

Use `assertNotRespondTo` / `assertPredicate` from
`packages/activesupport/src/testing/assertions.ts` for Rails helper kinds.

## Acceptance criteria

- Every file listed reports 0 count / kind / value mismatches.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes.
