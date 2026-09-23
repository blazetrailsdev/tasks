---
title: "Flip the assertion-mismatch gate from ratchet to hard zero"
status: blocked
updated: 2026-09-23
rfc: "0123-blocked-convergence-holding"
cluster: enforcement
packages:
  - "activerecord"
  - "activesupport"
deps:
  - "widen-assertion-report-packages-and-seed-mark"
  - "size-and-file-assertion-work-for-widened-packages"
  - "assertions-associations-and-eager"
  - "assertions-attribute-methods-test"
  - "assertions-autosave-association"
  - "assertions-base-test"
  - "assertions-belongs-to-has-one-inverse"
  - "assertions-calculations-test"
  - "assertions-database-tasks-and-schema-dumper"
  - "assertions-enum-dirty-strict-loading"
  - "assertions-finder-test"
  - "assertions-habtm-and-nested-through"
  - "assertions-has-many-associations"
  - "assertions-has-many-through-cluster"
  - "assertions-migration-cluster"
  - "assertions-persistence-and-nested-attributes"
  - "assertions-postgresql-geometric-array-and-adapter"
  - "assertions-postgresql-range-and-schema"
  - "assertions-reflection-primary-keys-multiparameter"
  - "assertions-relations-test"
  - "assertions-scoping-relation-batches-insert-all"
  - "assertions-sqlite3-adapter"
  - "assertions-tail-adapters-1"
  - "assertions-tail-adapters-2"
  - "assertions-tail-adapters-3a"
  - "assertions-tail-adapters-3b"
  - "assertions-tail-adapters-3c"
  - "assertions-tail-associations-1"
  - "assertions-tail-root-1"
  - "assertions-tail-root-2"
  - "assertions-tail-root-3"
  - "assertions-tail-root-4"
  - "assertions-tail-root-5a"
  - "assertions-tail-root-5b"
  - "assertions-tail-root-5c"
  - "assertions-tail-root-6a"
  - "assertions-tail-root-6b"
  - "assertions-transactions-locking-and-pool"
  - "assertions-validations-and-encryption"
  - "assertions-activesupport-date-time-ext"
  - "assertions-activesupport-duration-remainder"
  - "assertions-activesupport-hash-cluster-remainder"
  - "assertions-activesupport-logging-tail"
  - "assertions-activesupport-module-class-remainder"
  - "assertions-activesupport-string-ext-multibyte-safe-buffer"
  - "assertions-activesupport-time-ext"
  - "assertions-activesupport-time-with-zone-test"
  - "assertions-activesupport-time-zone-test"
  - "assertions-associations-test"
  - "assertions-date-parse-unported-parsers"
  - "assertions-globalid-locator"
  - "assertions-migration-constraint-files"
  - "assertions-migration-test-file"
  - "assertions-activesupport-time-with-zone-structural-remainder"
  - "assertions-activesupport-time-ext-source-remainder"
  - "assertions-activesupport-module-class-third-pass"
deps-rfc: []
est-loc: 200
priority: 9
pr: null
claim: null
assignee: null
blocked-by: "Re-verified 2026-09-23: the previous reason is stale — all 20 listed 0132 burndown stories are now done/closed, and RFC 0132 itself is 169 done / 19 closed / 0 open. The gate's enrolled closure is NOT at 0/0/0 though: pnpm parity:test:assertions reads activerecord 0 count / 5 kind / 2 value and activesupport 1 / 3 / 0 (activemodel, arel, date, globalid, i18n, did-you-mean, rack-session, rack-test, ruby-compat are 0/0/0). The 11 live counters, each with its file:\n(1) activerecord associations/has_many_associations_test.rb — 4 kind: 'calling empty with counter cache', 'calling empty on an association that has not been loaded performs a query', 'calling empty on an association that has been loaded does not performs query' all swap Rails empty/notEmpty for equal; 'association proxy transaction method starts transaction in association class' has a trails notNil against an unmapped Rails assert_called.\n(2) activerecord fixtures_test.rb — 1 kind: 'reloading fixtures through accessor methods', equal 2 vs 3 against an unmapped assert_called.\n(3) activerecord inheritance_test.rb — 1 value: 'new with ar base' expects 'Base is an abstract class and cannot be instantiated.' where Rails says 'ActiveRecord::Base is ...'. Straight message-string fidelity fix.\n(4) activerecord encryption/encryptable_record_test.rb — 1 value: 'forced encoding for deterministic attributes will replace invalid characters' expects 'Hello ??' vs Rails 'Hello \\uFFFD\\uFFFD'. This is the binary-String half of assertions-uniqueness-singleton-and-forced-encoding-residue and is genuinely language-blocked.\n(5) activesupport core_ext/string_ext_test.rb — 1 count + 1 kind: 'string to datetime', 5 vs 3 assertions (equal 4 vs 2).\n(6) activesupport multibyte_chars_test.rb — 1 kind: 'tidy bytes should tidy bytes', equal 9 vs 11 against an unmapped assert_equal_codepoints.\n(7) activesupport cache/serializer_with_fallback_test.rb — 1 kind: ' serializer logs unrecognized payloads', equal 0 vs 2 against an unmapped assert_logs.\nThree of these (assert_called x2, assert_equal_codepoints, assert_logs) are the trails-assert-helper-counts-as-one-unmapped-assertion class and may be comparer work rather than test work. Unblock when those 11 reach 0. Note the sequencing in tighten-assertion-mark-after-0132's prose is inverted relative to value: that story is now ready and should land FIRST, since reseeding drops 5914 counters of unenforced slack to ~11 and restores enforcement on ground 0132 already converged, without waiting on hard zero."
closed-reason: null
---

## Context

Assertion mismatches are report-only today: `scripts/test-compare/compare.ts:606-663`
records them, nothing fails on them, and RFC 0025's ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`, PR #5790,
`pnpm parity:test:assertions`) only guarantees the debt never grows. A number
that only counts when someone reads the report is the same problem as an
exclusion nobody revisits — which is why the RFC's "Done means" requires the
flip, not just the burn.

The precedent is in the same file: gate-mismatch went advisory → ratchet → hard
zero, and now `enforceGateZero` (`compare.ts:150-181`, `GATE_ENFORCED_PACKAGES`
at `:82`) exits non-zero with no baseline at all. This story does the same for
the three assertion axes, once every in-scope package reads 0/0/0 — it is the
last story in the RFC and is gated on all the `assertions-*` stories plus the
widened packages' burndown.

Its `deps` list is **maintained, not fixed**: the widened-package burndown
stories do not exist yet — `size-and-file-assertion-work-for-widened-packages`
files them once the measurement is in — so that story carries an acceptance
criterion to append each one it files to this story's `deps` (`pnpm tasks
set-deps`) before it closes. Do not close the sizing story with this list
unchanged, and do not claim this one on the strength of the current list alone.

## Acceptance criteria

- `pnpm parity:test -- --check` fails when any package in the in-scope closure
  reports a non-zero assertion-count, assertion-kind or assertion-value
  mismatch, with no baseline or mark to absorb it.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- The enforced package set is explicit and named in code the way
  `GATE_ENFORCED_PACKAGES` is, with the out-of-scope packages (actionview,
  trailties, actioncontroller, actiondispatch) still report-only.
- Before claiming: this story's `deps` include every widened-package assertion
  story that `size-and-file-assertion-work-for-widened-packages` filed, and all
  of them are `done`. A short `deps` list here means the sizing story's own
  acceptance criterion was skipped, not that the work is finished.
- CI is green on the flip, which is only true if every burndown story has
  landed — do not claim this story before then.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
