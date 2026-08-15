---
title: "Burn down the in-closure long tail: 33 members across 13 partially-ported files"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6556
claim: "2026-08-15T00:45:07Z"
assignee: "adapter-non-boolean-prepared-statements-config-raises"
blocked-by: null
closed-reason: null
---

# Burn down the in-closure long tail: 33 members across 13 partially-ported files

## Context

Measured 2026-08-14 (full `pnpm build` + `pnpm parity:api`, filtered through
`scripts/api-compare/output/ar-closure.json`; in-closure activesupport at
948/1115). After the three large clusters are carved off — HashWithIndifferentAccess
(28), Notifications (30), the eight files with no TS counterpart (39) — and
after excluding the date/time cluster that RFC 0098's currently-open stories
already own (`values/time_zone.rb` 12, `core_ext/date_time/conversions.rb` 8,
`time_with_zone.rb` 5, `core_ext/date/conversions.rb` 3,
`core_ext/time/conversions.rb` 1, `core_ext/time/acts_like.rb` 1), this is what
remains. Every file below already exists in TS; each is a small completion.

| Rails file                          | TS file                       | Missing members                                                                                            |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `core_ext/array/extract_options.rb` | `hash-utils.ts`               | `Hash#compact_blank`, `#compact_blank!`, `#to_xml`, `#deep_merge!`, `#from_xml`, `#from_trusted_xml`       |
| `number_helper.rb`                  | `number-helper.ts`            | `#number_to_delimited`, `#autoload`, `#autoload_under`, `#autoload_at`, `#eager_autoload`, `#eager_load!`  |
| `json/decoding.rb`                  | `json.ts`                     | `ActiveSupport#parse_json_times`, `#parse_json_times=`, `JSON#load`, `#parse_error`, `#convert_dates_from` |
| `ordered_options.rb`                | `ordered-options.ts`          | `OrderedOptions#_get`, `#extractable_options?`, `InheritableOptions#own_key?`, `#overridden?`              |
| `parameter_filter.rb`               | `parameter-filter.ts` (78 ln) | `#compile_filters!`, `#call`, `#value_for_key`, `#precompile_filters`                                      |
| `core_ext/array/conversions.rb`     | `array-utils.ts`              | `Array#to_fs`, `#to_formatted_s`, `#to_xml`                                                                |
| `descendants_tracker.rb`            | `descendants-tracker.ts`      | `WeakSet#include?`, `#disable_clear!`, `#reject!`                                                          |
| `inflector/inflections.rb`          | `inflector/inflections.ts`    | `Inflections#initialize`, `#instance_or_fallback`, `Inflector#inflections`                                 |
| `configuration_file.rb`             | `configuration-file.ts`       | `#read`, `#render`                                                                                         |
| `core_ext/array/access.rb`          | `core-ext/array/access.ts`    | `Array#compact_blank!`                                                                                     |
| `deep_mergeable.rb`                 | `deep-mergeable.ts`           | `#deep_merge!`                                                                                             |
| `inflector/methods.rb`              | `inflector.ts`                | `#const_regexp`                                                                                            |
| `inflector/transliterate.rb`        | `transliterate.ts`            | `#parameterize`                                                                                            |

Three things to settle rather than absorb:

1. **The XML members are not this story's.** `Hash#to_xml`, `#from_xml`,
   `#from_trusted_xml` and `Array#to_xml` all bottom out in `XmlMini`, which is
   RFC **0101**'s (`0101-activesupport-out-of-closure-surface`, and its
   `port-hash-from-xml` story is `ready` right now). Leave them; do not port a
   second XML path here. Note the dependency in the PR so the count reconciles.
2. **`number_helper.rb`'s five `autoload*`/`eager_load!` members are Rails
   autoload machinery**, not behavior — Zeitwerk/`ActiveSupport::Autoload`
   plumbing with no ESM counterpart. These want a `SKIP_GROUPS` entry with one
   shared reason, not five stub methods. `#number_to_delimited` is the one real
   port in that file.
3. **`parameter_filter.rb` is 78 lines to Rails' full class** and is missing
   `#call` — its main entry point. Check whether trails' filtering is reached by
   another name before porting; a duplicate path is worse than the gap.

## Acceptance criteria

- [ ] Every non-XML, non-autoload member listed above is ported at its Rails
      name per `docs/ruby-ts-conventions.md`, or carries a `SKIP_GROUPS` reason.
- [ ] The `autoload*`/`eager_load!` group is a single skip-group entry with one
      reason, not per-member stubs and not silent omissions.
- [ ] The four XML members are explicitly left to RFC 0101 and named as such in
      the PR body; no second XmlMini path is introduced.
- [ ] `ParameterFilter#call`'s disposition is stated: ported, or shown to be
      already reachable under another name (in which case that is a naming
      convergence, filed against RFC 0096).
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows;
      `pnpm parity:api:extra --package activesupport` shows no new surface.

## Notes

13 files is more than one PR. Suggested split: (a) the core-ext/enumerable
group, (b) inflector ×3 + descendants_tracker, (c) ordered_options +
parameter_filter + configuration_file + json/decoding. File (b) and (c) as
their own stories rather than fanning out PRs from one claim.
