---
title: "activesupport: converge or receipt the arm mismatches on top-level functions the skeleton writer newly compares"
status: draft
updated: 2026-10-09
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The skeleton writer (`skeletonsOfOwner`, `scripts/api-compare/compare.ts`) dropped every top-level
`export function` that the extractor's synthesized file module re-lists, so these pairs never reached
`pnpm parity:api:arms:report`. The writer fix (story
`skeleton-writer-drops-top-level-functions-relisted-by-the-synthesized-file-module`) grew
`call-skeletons.json` from 7602 rows to 8120, and the pairs below are the newly compared ones the
report files as mismatched. Each line is `<ts file>#<ts name> (<rb file>#<rb name>): <arm diff>`, where
`-token` is an arm Rails takes and the port omits and `+token` is one the port adds. The Ruby paths are
relative to the gem's `lib/<gem>/` under `vendor/rails/v8.0.2/` (or the vendored gem for thor, rack, i18n, pg).

**activesupport** (80)

- `core-ext/time/compatibility.ts#isSystemLocalTime (core_ext/time/compatibility.rb#system_local_time?)`: `-if`
- `string-utils.ts#remove (core_ext/string/filters.rb#remove)`: `+loop +if +if`
- `hash-utils.ts#_deepTransformKeysInObjectBang (core_ext/hash/keys.rb#_deep_transform_keys_in_object!)`: `+loop +if +loop`
- `string-utils.ts#indentBang (core_ext/string/indent.rb#indent!)`: `+if`
- `hash-utils.ts#symbolizeKeys (core_ext/hash/keys.rb#symbolize_keys)`: `-try -rescue +if +if`
- `hash-utils.ts#deepSymbolizeKeys (core_ext/hash/keys.rb#deep_symbolize_keys)`: `-try -rescue +if +if`
- `hash-utils.ts#deepTransformValuesBang (core_ext/hash/deep_transform_values.rb#deep_transform_values!)`: `+if +loop +if +loop`
- `inflector.ts#foreignKey (core_ext/string/inflections.rb#foreign_key)`: `+if`
- `inflector.ts#deconstantize (core_ext/string/inflections.rb#deconstantize)`: `+if`
- `inflector.ts#constantize (core_ext/string/inflections.rb#constantize)`: `+if +if +throw +if +loop +if +if +if +throw`
- `testing/constant-stubbing.ts#stubConst (testing/constant_stubbing.rb#stub_const)`: `+if +throw`
- `inflector.ts#safeConstantize (core_ext/string/inflections.rb#safe_constantize)`: `+try +rescue +if +throw`
- `core-ext/date-time/conversions.ts#civilFromFormat (core_ext/date_time/conversions.rb#civil_from_format)`: `+if`
- `core-ext/date/calculations.ts#findBeginningOfWeekBang (core_ext/date/calculations.rb#find_beginning_of_week!)`: `+if`
- `core-ext/time/conversions.ts#formattedOffset (core_ext/time/conversions.rb#formatted_offset)`: `+if +if +if`
- `core-ext/name-error.ts#missingName (core_ext/name_error.rb#missing_name)`: `-if`
- `xml-mini/rexml.ts#parse (xml_mini/rexml.rb#parse)`: `-if -if`
- `hash-utils.ts#symbolizeKeysBang (core_ext/hash/keys.rb#symbolize_keys!)`: `-try -rescue +if +if`
- `string-utils.ts#from (core_ext/string/access.rb#from)`: `+if`
- `deprecation/method-wrappers.ts#deprecateMethods (deprecation/method_wrappers.rb#deprecate_methods)`: `-if`
- `testing/deprecation.ts#collectDeprecations (testing/deprecation.rb#collect_deprecations)`: `+if +throw`
- `array-utils.ts#extractBang (core_ext/array/extract.rb#extract!)`: `-if +loop`
- `hash-utils.ts#deepSymbolizeKeysBang (core_ext/hash/keys.rb#deep_symbolize_keys!)`: `-try -rescue +if +if`
- `hash-utils.ts#reverseMergeBang (core_ext/hash/reverse_merge.rb#reverse_merge!)`: `+if +if +throw +loop +loop`
- `core-ext/date/calculations.ts#compareWithCoercion (core_ext/date/calculations.rb#compare_with_coercion)`: `+if +if +if`
- `array-utils.ts#inGroups (core_ext/array/grouping.rb#in_groups)`: `+loop`
- `inflector.ts#parameterize (core_ext/string/inflections.rb#parameterize)`: `+if +if +if`
- `core-ext/string/inflections.ts#pluralize (core_ext/string/inflections.rb#pluralize)`: `-if`
- `inflector.ts#demodulize (core_ext/string/inflections.rb#demodulize)`: `+if`
- `core-ext/file/atomic.ts#probeStatIn (core_ext/file/atomic.rb#probe_stat_in)`: `+throw +if`
- `inflector.ts#constRegexp (inflector/methods.rb#const_regexp)`: `+loop`
- `hash-utils.ts#toParam (core_ext/object/to_query.rb#to_param)`: `+if +if +if +if +if +if +if +if +if +if`
- `string-utils.ts#truncateWords (core_ext/string/filters.rb#truncate_words)`: `+if +if`
- `core-ext/time/compatibility.ts#activeSupportLocalZone (core_ext/time/compatibility.rb#active_support_local_zone)`: `+if`
- `string-utils.ts#truncate (core_ext/string/filters.rb#truncate)`: `+if +if +loop +if +if`
- `core-ext/securerandom.ts#base58 (core_ext/securerandom.rb#base58)`: `+if`
- `core-ext/date-time/calculations.ts#change (core_ext/date_time/calculations.rb#change)`: `+if +if +if +if +if +if +if +if +if`
- `lazy-load-hooks.ts#onLoad (lazy_load_hooks.rb#on_load)`: `+if`
- `time-zone-config.ts#zone (core_ext/time/zones.rb#zone)`: `+if`
- `array-utils.ts#toSentence (core_ext/array/conversions.rb#to_sentence)`: `+loop +loop +if`
- `core-ext/date-time/conversions.ts#formattedOffset (core_ext/date_time/conversions.rb#formatted_offset)`: `+if`
- `array-utils.ts#wrap (core_ext/array/wrap.rb#wrap)`: `+if +if`
- `hash-utils.ts#toQuery (core_ext/object/to_query.rb#to_query)`: `+if +if +if +if`
- `hash-utils.ts#deepDup (core_ext/object/deep_dup.rb#deep_dup)`: `+if +if +if +if +loop +if +if +loop +if +if +if`
- `string-utils.ts#last (core_ext/string/access.rb#last)`: `+if +if`
- `string-utils.ts#to (core_ext/string/access.rb#to)`: `+if`
- `string-utils.ts#truncateBytes (core_ext/string/filters.rb#truncate_bytes)`: `+loop`
- `testing/tests-without-assertions.ts#afterTeardown (testing/tests_without_assertions.rb#after_teardown)`: `+if`
- `core-ext/date/calculations.ts#advance (core_ext/date/calculations.rb#advance)`: `+if +if +if +if +if`
- `string-utils.ts#at (core_ext/string/access.rb#at)`: `+if +if +if +if +if +if +if +if`
- `core-ext/file/atomic.ts#atomicWrite (core_ext/file/atomic.rb#atomic_write)`: `+throw +if`
- `inflector.ts#underscore (core_ext/string/inflections.rb#underscore)`: `+if +if +if`
- `core-ext/date-and-time/calculations.ts#beginningOfWeek (core_ext/date_and_time/calculations.rb#beginning_of_week)`: `+if +if`
- `core-ext/securerandom.ts#base36 (core_ext/securerandom.rb#base36)`: `+if`
- `inflector.ts#upcaseFirst (core_ext/string/inflections.rb#upcase_first)`: `+if`
- `hash-utils.ts#reverseMerge (core_ext/hash/reverse_merge.rb#reverse_merge)`: `+if`
- `core-ext/tse/util.ts#htmlEscapeOnce (core_ext/erb/util.rb#html_escape_once)`: `+if`
- `array-utils.ts#split (core_ext/array/grouping.rb#split)`: `-loop +if`
- `core-ext/string/conversions.ts#toTime (core_ext/string/conversions.rb#to_time)`: `+if +if +if`
- `hash-utils.ts#deepTransformValues (core_ext/hash/deep_transform_values.rb#deep_transform_values)`: `+if +if +loop`
- `core-ext/date/calculations.ts#change (core_ext/date/calculations.rb#change)`: `+if +if +if +if +if +if +if`
- `testing/deprecation.ts#assertDeprecated (testing/deprecation.rb#assert_deprecated)`: `+if`
- `core-ext/hash/slice.ts#sliceBang (core_ext/hash/slice.rb#slice!)`: `+loop +if +loop +if +if +loop +loop`
- `xml-mini/nokogiri.ts#parse (xml_mini/nokogiri.rb#parse)`: `+try`
- `core-ext/date-and-time/compatibility.ts#preserveTimezone (core_ext/date_and_time/compatibility.rb#preserve_timezone)`: `+if`
- `core-ext/string/multibyte.ts#isUtf8 (core_ext/string/multibyte.rb#is_utf8?)`: `-if -if`
- `hash-utils.ts#assertValidKeys (core_ext/hash/keys.rb#assert_valid_keys)`: `+if`
- `string-utils.ts#first (core_ext/string/access.rb#first)`: `+if`
- `core-ext/time/conversions.ts#toFs (core_ext/time/conversions.rb#to_fs)`: `+if +if`
- `hash-utils.ts#isExtractableOptions (core_ext/array/extract_options.rb#extractable_options?)`: `+if`
- `testing/deprecation.ts#assertNotDeprecated (testing/deprecation.rb#assert_not_deprecated)`: `+if +throw`
- `cache.ts#lookupStore (cache.rb#lookup_store)`: `+if`
- `core-ext/object/inclusion.ts#isIn (core_ext/object/inclusion.rb#in?)`: `-try -rescue +if +if +if +if +if`
- `core-ext/digest/uuid.ts#packUuidNamespace (core_ext/digest/uuid.rb#pack_uuid_namespace)`: `+if`
- `hash-utils.ts#_deepTransformKeysInObject (core_ext/hash/keys.rb#_deep_transform_keys_in_object)`: `+loop +if`
- `time-zone-config.ts#findZoneBang (core_ext/time/zones.rb#find_zone!)`: `+if`
- `inflector.ts#humanize (core_ext/string/inflections.rb#humanize)`: `+loop +if +if +if +if +if +if`
- `transliterate.ts#transliterate (inflector/transliterate.rb#transliterate)`: `-if -if -if -if`
- `core-ext/time/compatibility.ts#toTime (core_ext/date_time/compatibility.rb#to_time)`: `+if`
- `inflector.ts#downcaseFirst (core_ext/string/inflections.rb#downcase_first)`: `+if`

Re-derive the current list with `pnpm tsx scripts/api-compare/report-arms.ts --sample=100000`.

## Acceptance criteria

- [ ] Each pair is converged onto Rails' control flow, or its invented arm carries an
      `@inventedArm <token> — PERMANENT|CONVERGEABLE <story-id>` receipt on the declaration.
- [ ] A row that is a comparer artefact (a mispairing, an idiom fold) is fixed in the comparer, not receipted.
- [ ] `pnpm parity:api:arms:throws` stays green without raising a mark.
