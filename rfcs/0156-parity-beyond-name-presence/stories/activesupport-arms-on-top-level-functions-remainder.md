---
title: "activesupport-arms-on-top-level-functions-remainder"
status: draft
updated: 2026-11-16
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
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

Remainder of `activesupport-arms-on-top-level-functions-the-skeleton-writer-newly-compares`. Its PR converged `string-utils.ts` `at`/`first`/`last`/`from`/`to` (onto `strSlice`, Ruby's `self[...]`, `core_ext/string/access.rb`), `array-utils.ts#split` (`core_ext/array/grouping.rb:93-108`), `name-error.ts#missingName` (`core_ext/name_error.rb:16`) and `time/compatibility.ts#isSystemLocalTime` (`core_ext/time/compatibility.rb:22-28`). These pairs are still mismatched in `pnpm tsx scripts/api-compare/report-arms.ts --sample=100000`:

Findings from that pass:

- **Comparer mispairing.** `RUBY_FILE_TS_OVERRIDES` (`scripts/parity/conventions.ts`) maps both `inflector/methods.rb` and `core_ext/string/inflections.rb` to `inflector.ts`. For a name both files define (`foreign_key`, `demodulize`, `deconstantize`, `underscore`, `humanize`, `parameterize`, `upcase_first`, `downcase_first`, `constantize`, `safe_constantize`), `call-skeletons.json` holds only the `String#…` row (`ruby: ["ref:foreign_key"]`), so the free function that ports `ActiveSupport::Inflector.foreign_key` (`inflector/methods.rb:267`) is held to the one-line String wrapper. Fix in the comparer (`scripts/api-compare/compare.ts`, the per-name `seen` dedup and `rubySkeletonByName` around `callSkeletons.push`), not with receipts.
- `core-ext/string/inflections.ts#pluralize` gained `locale = count if count.is_a?(Symbol)` (`core_ext/string/inflections.rb:35-42`) and still reads `-if`; check the pairing.
- `deprecation/method-wrappers.ts#deprecateMethods` lacks the `mod ||= Module.new` / `prepend` arm (`deprecation/method_wrappers.rb:35-66`).
- `core-ext/string/multibyte.ts#isUtf8` and `transliterate.ts#transliterate` miss encoding arms. A String has no encoding tag (root CLAUDE.md § "A String has no encoding tag either"), so close those rows as PERMANENT rather than converge them.

Remaining rows:

- `activesupport/core-ext/date-time/conversions.ts#formattedOffset`: `+if`
- `activesupport/string-utils.ts#remove`: `+loop +if +if`
- `activesupport/inflector.ts#safeConstantize`: `+try +rescue +if +throw`
- `activesupport/string-utils.ts#indentBang`: `+if`
- `activesupport/testing/constant-stubbing.ts#stubConst`: `+if +if +if +throw +if +if`
- `activesupport/core-ext/string/conversions.ts#toTime`: `+if +if`
- `activesupport/time-zone-config.ts#zone`: `+if`
- `activesupport/core-ext/hash/slice.ts#sliceBang`: `+loop +if +loop +if +if +loop +loop`
- `activesupport/transliterate.ts#transliterate`: `-if -if -if -if`
- `activesupport/hash-utils.ts#deepSymbolizeKeys`: `-try -rescue +if +if`
- `activesupport/hash-utils.ts#toQuery`: `+if +if +if +if`
- `activesupport/hash-utils.ts#_deepTransformKeysInObject`: `+loop +if`
- `activesupport/core-ext/string/multibyte.ts#isUtf8`: `-if -if`
- `activesupport/hash-utils.ts#deepTransformValuesBang`: `+if +loop +if +loop`
- `activesupport/inflector.ts#humanize`: `+loop +if +if +if +if +if +if`
- `activesupport/hash-utils.ts#isExtractableOptions`: `+if`
- `activesupport/testing/tests-without-assertions.ts#afterTeardown`: `+if`
- `activesupport/core-ext/tse/util.ts#htmlEscapeOnce`: `+if`
- `activesupport/array-utils.ts#wrap`: `+if +if`
- `activesupport/testing/deprecation.ts#assertNotDeprecated`: `+if +throw`
- `activesupport/inflector.ts#deconstantize`: `+if`
- `activesupport/core-ext/time/compatibility.ts#activeSupportLocalZone`: `+if`
- `activesupport/core-ext/date-and-time/compatibility.ts#preserveTimezone`: `+if`
- `activesupport/core-ext/securerandom.ts#base36`: `+if`
- `activesupport/core-ext/object/inclusion.ts#isIn`: `-try -rescue +if +if +if +if +if`
- `activesupport/inflector.ts#downcaseFirst`: `+if`
- `activesupport/core-ext/date-time/calculations.ts#change`: `+if +if +if +if +if +if +if +if +if`
- `activesupport/time-zone-config.ts#findZoneBang`: `+if`
- `activesupport/hash-utils.ts#assertValidKeys`: `+if`
- `activesupport/hash-utils.ts#symbolizeKeys`: `-try -rescue +if +if`
- `activesupport/core-ext/time/conversions.ts#formattedOffset`: `+if +if +if`
- `activesupport/hash-utils.ts#_deepTransformKeysInObjectBang`: `+loop +if +loop`
- `activesupport/testing/deprecation.ts#collectDeprecations`: `+if +throw`
- `activesupport/hash-utils.ts#deepDup`: `+if +if +if +if +loop +if +if +loop +if +if +if`
- `activesupport/testing/deprecation.ts#assertDeprecated`: `+if`
- `activesupport/string-utils.ts#truncateWords`: `+if +if`
- `activesupport/xml-mini/nokogiri.ts#parse`: `+try`
- `activesupport/inflector.ts#constRegexp`: `+loop`
- `activesupport/core-ext/date/calculations.ts#compareWithCoercion`: `+if +if +if`
- `activesupport/hash-utils.ts#deepTransformValues`: `+if +if +loop`
- `activesupport/core-ext/date/calculations.ts#advance`: `+if +if +if +if +if`
- `activesupport/core-ext/date/calculations.ts#findBeginningOfWeekBang`: `+if`
- `activesupport/inflector.ts#upcaseFirst`: `+if`
- `activesupport/core-ext/date-time/conversions.ts#civilFromFormat`: `+if`
- `activesupport/inflector.ts#foreignKey`: `+if`
- `activesupport/hash-utils.ts#reverseMerge`: `+if`
- `activesupport/cache.ts#lookupStore`: `+if`
- `activesupport/hash-utils.ts#deepSymbolizeKeysBang`: `-try -rescue +if +if`
- `activesupport/inflector.ts#demodulize`: `+if`
- `activesupport/string-utils.ts#truncate`: `+if +if +loop +if +if`
- `activesupport/core-ext/date/calculations.ts#change`: `+if +if +if +if +if +if +if`
- `activesupport/xml-mini/rexml.ts#parse`: `-if -if`
- `activesupport/lazy-load-hooks.ts#onLoad`: `+if`
- `activesupport/core-ext/string/inflections.ts#pluralize`: `-if`
- `activesupport/inflector.ts#underscore`: `+if +if +if`
- `activesupport/hash-utils.ts#symbolizeKeysBang`: `-try -rescue +if +if`
- `activesupport/array-utils.ts#extractBang`: `-if +loop`
- `activesupport/core-ext/file/atomic.ts#atomicWrite`: `+throw +if`
- `activesupport/core-ext/file/atomic.ts#probeStatIn`: `+throw +if`
- `activesupport/core-ext/digest/uuid.ts#packUuidNamespace`: `+if`
- `activesupport/core-ext/date-and-time/calculations.ts#beginningOfWeek`: `+if +if`
- `activesupport/array-utils.ts#toSentence`: `+loop +if +if`
- `activesupport/hash-utils.ts#reverseMergeBang`: `+if`
- `activesupport/string-utils.ts#truncateBytes`: `+loop`
- `activesupport/hash-utils.ts#toParam`: `+if +if +if +if +if +if +if +if +if +if`
- `activesupport/deprecation/method-wrappers.ts#deprecateMethods`: `-if`
- `activesupport/array-utils.ts#inGroups`: `+loop`
- `activesupport/inflector.ts#parameterize`: `+if +if +if`
- `activesupport/core-ext/securerandom.ts#base58`: `+if`

## Acceptance criteria

- [ ] The inflector double-mapping is fixed in the comparer and its rows re-pair against `inflector/methods.rb`.
- [ ] Each remaining pair is converged onto Rails' control flow, or its invented arm carries `@inventedArm <token> — PERMANENT|CONVERGEABLE <story-id>`.
- [ ] `pnpm parity:api:arms:throws` stays green without raising a mark.
