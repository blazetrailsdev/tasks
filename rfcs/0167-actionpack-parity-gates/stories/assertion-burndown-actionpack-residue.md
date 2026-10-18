---
title: "Converge actionpack's remaining assertion mismatches to zero"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: ["assertion-kinds-fold-actionpack-private-assert-helpers"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/assertion-mismatch-mark.json` on trails `main` @ `87094a5097` holds actiondispatch at `{assertionCount 9, kind 32, value 2}` and actioncontroller at `{9, 31, 0}`. The kind/value rows by file (from `output/convention-comparison.json`):

- actiondispatch: `dispatch/system_testing/screenshot_helper_test.rb` 12, `dispatch/routing_test.rb` 7 (+2 value), `dispatch/debug_exceptions_test.rb` 3, `dispatch/test_response_test.rb` 3, `dispatch/response_test.rb` 2 (the `assert_set_cookie_header` helper), `dispatch/exception_wrapper_test.rb` 2, `dispatch/param_builder_test.rb` 2, `dispatch/mime_type_test.rb` 1
- actioncontroller: `controller/rescue_test.rb` 17 (`assert_response` → `equal`), `controller/allow_browser_test.rb` 6, `controller/action_pack_assertions_test.rb` 6, `controller/integration_test.rb` 1, `controller/parameters/always_permitted_parameters_test.rb` 1

`assertion-kinds-fold-actionpack-private-assert-helpers` (in progress, trails#9046) folds same-file `assert_*` helpers and the `assert_difference` family. Whatever it does not clear is this story's to fix.

## Acceptance criteria

- After the dependency lands, re-measure with `pnpm parity:test --assertions --package actiondispatch` and `--package actioncontroller`. Converge each remaining row onto Rails' assertion: the TS test asserts what the Rails test asserts, with the kind-mapped helper.
- All three actionpack packages reach `{0, 0, 0}`, and the marks are reseeded with `pnpm parity:test:assertions:reseed`. If a residue is a genuine tooling gap, file it with evidence instead of leaving it in the mark.
