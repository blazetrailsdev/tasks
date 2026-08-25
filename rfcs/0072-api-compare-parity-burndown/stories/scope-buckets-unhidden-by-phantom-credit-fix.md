---
title: "Scope or port the 31 zero-port buckets un-hidden by the phantom-credit fix"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6423
claim: "2026-08-12T15:56:54Z"
assignee: "converge-mark-for-destruction-slot-writes"
blocked-by: null
closed-reason: null
---

## Context

PR #6414 (`no-matched-credit-for-files-with-no-ts-counterpart`) stopped crediting
`matched` to Ruby files with no TS counterpart. That un-hid 31 buckets whose port
does not exist at all but which had been reading as partly ported off cross-file
name collisions — 630 members total:

| package       | files | members un-credited |
| ------------- | ----: | ------------------: |
| actionview    |    18 |                 574 |
| activesupport |     9 |                  37 |
| trailties     |     4 |                  19 |

Every one of them is outside the AR/AM require closure, which is exactly what
`scripts/parity/unported-files/*.ts` exists to declare — `execution_wrapper.rb`
was scoped there in #6411 for the same reason. They are currently NOT scoped, so
they read as unported convergence gaps rather than as deliberately-deferred
out-of-closure files, and they drag `percent` (the stats DB metric) down with a
number that measures a scope decision rather than porting debt.

The buckets, from `scripts/api-compare/output/api-comparison.json` (files with
`tsFileExists: false`, no `misplacedAt`):

- actionview: `helpers.rb`, `test_case.rb` (58 each), `helpers/form_helper.rb`,
  `helpers/form_tag_helper.rb`, `helpers/form_options_helper.rb`,
  `helpers/tags/base.rb`, `helpers/tags/{collection_check_boxes,
collection_radio_buttons,collection_select,grouped_collection_select,select,
time_zone_select,weekday_select}.rb` (~36 each),
  `helpers/{asset_tag,translation,url}_helper.rb` (15 each), `layouts.rb`,
  `renderer/collection_renderer.rb`
- activesupport: `core_ext/object/acts_like.rb`, `core_ext/array/access.rb`,
  `core_ext/array/extract_options.rb`, `core_ext/numeric/bytes.rb`,
  `deprecation/disallowed.rb`, `logger_silence.rb`,
  `logger_thread_safe_level.rb`, `rescuable.rb`, `testing/constant_lookup.rb`
- trailties: `generators/app_name.rb`,
  `generators/erb/scaffold/scaffold_generator.rb`,
  `generators/rails/scaffold_controller/scaffold_controller_generator.rb`,
  `generators/test_unit/scaffold/scaffold_generator.rb`

## Converged shape

Triage each bucket and add an `UNPORTED_FILES` entry (pattern, testFile where one
exists, package, reason) for the ones that are genuinely out of the AR/AM closure,
mirroring the existing activesupport entries. A bucket that IS in the closure and
merely unported stays unscoped — it is real debt and must keep reading as missing.
Do not re-open cross-file credit for any of them: #6414's gate is the correct
accounting, and scoping is the right register for a deliberate deferral.

The activesupport core_ext buckets need care: `acts_like.rb` (9/10) and
`core_ext/array/access.rb` reopen `Object`/`Array`, so check whether trails ports
them under a different file before scoping — a real port living elsewhere wants a
`RUBY_FILE_TS_OVERRIDES` or misplaced-cluster fix instead of a scope entry.

## Acceptance criteria

- Each of the 31 buckets is either scoped in `scripts/parity/unported-files/*.ts`
  with a reason, or explicitly left unscoped as real in-closure debt.
- No bucket regains `matched` credit; the #6414 gate is untouched.
- The `percent` movement from the scoping is stated in the PR body.
