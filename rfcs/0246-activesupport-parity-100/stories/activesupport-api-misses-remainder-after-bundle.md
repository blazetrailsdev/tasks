---
title: "activesupport-api-misses-remainder-after-bundle"
status: draft
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
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

Remainder of the RFC 0246 API-miss stories `activesupport-api-dependencies-and-syntax-error-proxy`,
`activesupport-api-singletons-core-ext-and-cache` and `activesupport-api-singletons-runtime-and-messages`
after their bundle PR, from `pnpm parity:api --package activesupport --missing`:

- `dependencies.rb` (7/17): `interlock`/`interlock=`, `autoload_paths`, `autoload_once_paths`,
  `_eager_load_paths`, `_autoloaded_tracked_classes` and writers. `lib/dependencies.ts` holds them
  as data properties on a plain object, which the extractor does not credit as `singleton_class.attr_accessor`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/dependencies.rb:16-80`).
- `dependencies/require_dependency.rb` (✗) and `test/dependencies_test.rb` (✗): `PERMANENT:` rows citing
  root CLAUDE.md "`Module#autoload` is a build step" and "The application loader is Zeitwerk".
- `cache/coder.rb`: `LazyEntry#value` / `mismatched?` live in a lazily built class expression
  (`lib/cache/coder.ts` `lazyEntryClass`, an `entry.ts` <-> `coder.ts` cycle) the extractor cannot see.
- `core_ext/date_time/compatibility.rb#to_time`, `core_ext/date_time/conversions.rb#inspect`,
  `core_ext/time/compatibility.rb#to_time`, `core_ext/time/calculations.rb#at`,
  `core_ext/hash/conversions.rb#to_xml`, `core_ext/object/with.rb#with`,
  `core_ext/thread/backtrace/location.rb#spot` (✗).
- `duration.rb` `init_with`/`encode_with`; `json/encoding.rb` `encode`/`dump`; `multibyte/chars.rb`
  `to_s`/`to_str` (present as `toS`/`toStr`, still uncredited — check the alias crediting);
  `current_attributes.rb#method_added`; `encrypted_configuration.rb` `InvalidKeyLengthError#message`;
  `execution_wrapper.rb` `Null.complete!`; `ordered_options.rb#pretty_print`;
  `xml_mini/nokogiri.rb#to_hash`; `xml_mini/rexml.rb#require_rexml`.
- `TestCase.parallelize` (`test_case.rb:81-86`) is unported, so nothing reads
  `ActiveSupport.testParallelizationThreshold` yet.

## Acceptance criteria

- [ ] Each member above is ported onto its Rails owner, or receipted under a named CLAUDE.md section.
- [ ] Every file above reaches 100% in `parity:api`, and no ✗ file is left.
