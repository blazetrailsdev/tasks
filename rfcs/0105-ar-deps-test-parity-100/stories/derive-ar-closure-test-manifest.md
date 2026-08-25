---
title: "Derive the AR-closure activesupport test manifest and guard it"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: boundary-and-measurement
packages:
  - "activesupport"
deps: []
deps-rfc: []
est-loc: 320
priority: 1
pr: 6505
claim: "2026-08-14T02:27:09Z"
assignee: "derive-ar-closure-test-manifest"
blocked-by: null
closed-reason: null
---

## Context

RFC 0098 derived a _member_ closure for the API gate by walking
`require "active_support/…"` from `vendor/rails/activerecord/lib` +
`vendor/rails/activemodel/lib`. The test gate needs the same closure expressed
as a **test-file** boundary, and `vendor/rails/activesupport/test/` is organized
by feature, not by consumer, so no rule falls out for free.

The derivation is done and reproduced in this RFC's README: 62 seed requires,
**144 closure files** under `vendor/rails/activesupport/lib/active_support/`,
and a three-rule mapping onto the 164 Rails activesupport test files that splits
the package 73 in-closure files / 1,883 tests / 250 remaining against 91
out-of-closure files / 1,072 tests / 201 remaining. Rules R1 (path) and R2
(directory) are exact; rule R3 (basename) is a heuristic that misfires — it
maps `activesupport/test/core_ext/pathname/blank_test.rb` onto
`active_support/core_ext/date/blank.rb` on basename alone.

So the shipped boundary is R1 + R2 in code plus a reviewed, checked-in alias
table for everything they miss, and a guard that fails when an activesupport
test file is neither auto-derived nor listed — the point being that a reviewer
can _run_ something to settle whether a file is in or out. The known
alias-needing files (R3 today) are `time_zone_test.rb` →
`active_support/values/time_zone.rb`, `core_ext/time_with_zone_test.rb` →
`active_support/time_with_zone.rb`, `share_lock_test.rb` →
`active_support/concurrency/share_lock.rb`, `autoload_test.rb` →
`active_support/dependencies/autoload.rb`, `transliterate_test.rb` →
`active_support/inflector/transliterate.rb`,
`core_ext/module/attribute_accessor_per_thread_test.rb` →
`active_support/core_ext/module/attribute_accessors_per_thread.rb`,
`multibyte_proxy_test.rb` → `active_support/multibyte.rb`.

Precedent for where this lives: `scripts/parity/conventions.ts` (the
Ruby→TS name/path table, CI-verified current and documented at
`docs/ruby-ts-conventions.md`) and `scripts/parity/unported-files/index.ts`
(the registry grammar). This is a manifest, not an exclusion registry — it
removes nothing from any denominator.

## Acceptance criteria

- A script derives the `require "active_support/…"` closure from
  `vendor/rails/activerecord/lib` + `vendor/rails/activemodel/lib` at run time
  (no hand-copied file list) and maps it to Rails activesupport test files by
  R1/R2 plus a checked-in alias table with one reason line per alias.
- A command (e.g. `pnpm parity:test:closure [<test file>]`) prints in/out for a
  given activesupport test file and, with no argument, the full partition with
  file and test counts.
- A guard fails when any file under `vendor/rails/activesupport/test/` is
  neither auto-derived nor aliased nor explicitly listed as out-of-closure, so
  a new vendored Rails test file cannot silently land on either side.
- Unit tests cover R1, R2, an alias hit, and the guard's failure mode.
- No change to `scripts/parity/unported-files/`, to any baseline, or to any
  package's `percent`.
