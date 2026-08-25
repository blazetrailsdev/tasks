---
title: "api-compare-orphan-buckets-activesupport-core-ext-tail-2"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6202
claim: "2026-08-07T21:04:43Z"
assignee: "api-compare-orphan-buckets-activesupport-core-ext-tail-2"
blocked-by: null
closed-reason: null
---

## Context

Second slice of `api-compare-orphan-buckets-activesupport-core-ext-tail`
(PR pending). That PR resolved the `version.rb` orphans in every package
(anchored `pattern: "/version.rb"` in `UNPORTED_FILES`, plus the
`splitOverriddenFileBuckets` change that lets an unported reopening own a
bucket so the exclusion can fire) and added `RUBY_FILE_TS_OVERRIDES` entries for
the hash / object / string / module / array / range clusters:
`core_ext/hash/{keys,reverse_merge,deep_transform_values}.rb`,
`core_ext/object/{to_query,deep_dup}.rb`,
`core_ext/string/{filters,access,indent,strip}.rb`,
`core_ext/module/{attr_internal,attribute_accessors,introspection,delegation,anonymous}.rb`,
`core_ext/array/{grouping,extract,wrap}.rb`, `core_ext/range/overlap.rb`.
Measured effect: activesupport 918/2333 → 962/2324, overall 13151 → 13192.

What is left (enumerate with the orphan query in
`api-compare-orphan-reopened-file-buckets`; counts are methods):

- The date/time conversions cluster, which belongs with the already-mapped
  `calculations.rb` trio on `time-ext.ts`: `core_ext/date_time/conversions.rb`
  (13), `core_ext/date/conversions.rb` (7), `core_ext/time/conversions.rb` (4),
  `core_ext/time/zones.rb` (7 — `time-zone-config.ts`),
  `core_ext/time/compatibility.rb` (4), `core_ext/date_time/compatibility.rb`,
  `core_ext/string/conversions.rb` (3), `core_ext/string/zones.rb`,
  `core_ext/time/acts_like.rb`, `core_ext/date/blank.rb`,
  `core_ext/date_time/blank.rb`.
- The Duration cluster: `core_ext/numeric/time.rb` (13),
  `core_ext/integer/time.rb` (4) → `duration.ts`.
- The genuinely-unported tail, which wants an `UNPORTED_FILES` entry rather than
  an override (each has NO trails counterpart today — verified by name lookup
  against `output/ts-api.json`): `core_ext/module/attribute_accessors_per_thread.rb`
  (6), `core_ext/module/remove_method.rb`, `core_ext/object/instance_variables.rb`,
  `core_ext/symbol/starts_ends_with.rb`, `core_ext/string/starts_ends_with.rb`,
  `core_ext/string/multibyte.rb`, `core_ext/integer/multiple.rb`,
  `core_ext/module/deprecation.rb`, `core_ext/object/with_options.rb`,
  `core_ext/string/behavior.rb`, `core_ext/regexp.rb`,
  `core_ext/pathname/existence.rb`, `core_ext/kernel/singleton_class.rb`.
- The remaining mixed ones: `core_ext/kernel/reporting.rb` (4),
  `core_ext/module/redefine_method.rb` (4), `core_ext/array/conversions.rb` (4),
  `core_ext/hash/{indifferent_access,slice,deep_merge,except}.rb`,
  `core_ext/object/{inclusion,with}.rb`, `core_ext/class/subclasses.rb`,
  `core_ext/{array,string}/inquiry.rb`, `core_ext/string/exclude.rb`,
  `inflector/transliterate.rb`.

Expect newly-measured buckets to surface pre-existing call-mismatch rows (the
first slice surfaced 7: `Integer#div`, `Array.new`, `transform_keys`,
`Delegation.generate`, `caller_locations(...).first`). Hand-add them with real
reasons via `serializeBaseline` — never `--write` — or converge them.

## Acceptance criteria

- Every remaining activesupport `core_ext/*` orphan file either carries a
  `RUBY_FILE_TS_OVERRIDES` entry naming its real TS home or an `UNPORTED_FILES`
  entry with a reason; the orphan query returns nothing for activesupport
  except files covered by one of the two.
- Per-package ported-method deltas reported in the PR body.
- `pnpm parity:api:calls` green with no `--write` reseed of unrelated packages.
- Split under the LOC ceiling; register a further slice if needed.
