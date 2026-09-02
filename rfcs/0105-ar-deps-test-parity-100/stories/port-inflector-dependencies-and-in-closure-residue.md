---
title: "Port inflector, range_ext, inclusion and the in-closure residue (~12)"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activesupport"
deps:
  - "triage-activesupport-in-closure-skip-stubs"
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These files are **in the AR require-closure** by the manifest from
`derive-ar-closure-test-manifest` — activesupport code ActiveRecord and
ActiveModel actually load — so they are on the critical path for this RFC's
`activesupport 100%`. Measured 2026-08-13 with
`pnpm parity:test -- --cached --package activesupport`:

- `vendor/rails/activesupport/test/inflector_test.rb` — 8 remaining — 4 stubs, 4 missing
- `vendor/rails/activesupport/test/core_ext/enumerable_test.rb` — 4 missing
- `vendor/rails/activesupport/test/core_ext/range_ext_test.rb` — 2 stubs
- residue — `core_ext/object/inclusion_test.rb` 1 stub, `deep_mergeable_test.rb` 1 stub

Scope after `triage-activesupport-in-closure-skip-stubs` (2026-09-01): the bulk
of this story's original list became case-level exclusions and left the
remainder — `share_lock_test.rb` (25, Thread/Monitor), `dependencies_test.rb`
(10, `Kernel#require`), `autoload_test.rb` (6, `Module#autoload`),
`transliterate_test.rb` (5, Ruby `Encoding`),
`concurrency/load_interlock_aware_monitor_test.rb` (3, GVL),
`core_ext/class/attribute_test.rb` (4, singleton class / `Module#prepend`),
`core_ext/module/attribute_accessor_test.rb` (1),
`descendants_tracker_test.rb` (1, GC), and `inflector_test.rb`'s `constantize` /
`safe constantize` (`Object.const_get`). Five of those files lost their TS file
entirely. What remains here is portable: `inflector`'s `pluralize with
fallback`, `parameterize and normalize`, `parameterize with locale` and
`inflector locality` (all I18n-backed), `range_ext`'s two TimeWithZone cases,
`inclusion`'s `no method catching`, and `deep_mergeable`'s
`deep_merge? can be overridden…`.

Ports go in the convention TS file the compare report names beside each Ruby
file (e.g. `core_ext/hash_ext_test.rb` → `packages/activesupport/src/core-ext/hash-ext.test.ts`);
the Rails sources are under `vendor/rails/activesupport/lib/active_support/`.
Claim `triage-activesupport-in-closure-skip-stubs` first — it decides which of
these stubs are ports and which are case-level exclusions, and this story's
scope is whatever it marks as portable.

Overlap note: RFC 0098 owns the **API** gate for these same files (its core-ext
sweeps, time-with-zone residue and testing-helper slots). Where a case here
fails only because a member is unported, that member is 0098's — port it there
or file it there, and keep this PR to the test side.

## Acceptance criteria

- Each portable case exists with the Rails name verbatim, unskipped, passing.
- Non-portable cases carry case-level `tests:` exclusions with specific reasons
  (landed by the triage story, not invented here).
- `pnpm parity:test -- --package activesupport` shows these files at 0 missing
  and 0 skipped, and the AR-closure sub-metric rises accordingly.
- No new whole-file `unported-files` rows.
