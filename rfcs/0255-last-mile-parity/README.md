---
rfc: "0255-last-mile-parity"
title: "Last mile to 100% parity for the near-complete packages"
status: active
created: 2026-11-20
updated: 2026-11-21
owner: "@deanmarano"
packages:
  - scripts
  - actioncable
  - actionmailbox
  - actionmailer
  - actionpack
  - actiontext
  - actionview
  - activerecord
  - activestorage
  - activesupport
  - et-orbi
  - fugit
  - image-processing
  - mail
  - marcel
  - rack
  - rack-proxy
  - rack-session
  - rack-test
  - rake
  - solid-cache
  - thor
  - tse-compiler
  - turbo
  - vite-assets
  - vite-trails
  - website
  - ruby-compat
related-rfcs:
  - "0246-activesupport-parity-100"
  - "0254-mysql2-gem-port"
  - "0168-rack-cache-gem-port"
  - "0189-activerecord-surfaced-deviations"
  - "0141-actionpack-surfaced-deviations"
  - "0123-blocked-convergence-holding"
clusters:
  - measurement
  - small-packages
  - activerecord
  - actionpack
  - mail
  - activesupport
---

# RFC 0255 — Last mile to 100% parity for the near-complete packages

## Summary

Twenty-two packages are within a few dozen items of 100% on `parity:api` and
`parity:test`. This RFC lists every remaining item with its Rails or gem
`file:line` and sorts it as PORTABLE or PERMANENT. PORTABLE items are owned by
an existing story where one exists, and by a new story here where none does.
It also changes how permanent items are counted. Today the `parity:test`
headline counts a `PERMANENT-SKIP` as an open gap, and the website counts a
`BLOCKED:` skip as matched. After this RFC, both report permanent items as
their own unported figure, and the target is 100% of what is portable.

## Motivation

Measured on 2026-11-20 at `b5e8c88baa` (fresh `pnpm build`, then
`pnpm parity:api --missing`, `pnpm parity:test -- --missing`,
`pnpm parity:packages`). The API figure is the sum of `methodsMissing` over
`package-summary.json`'s `files[]`, the number the website shows. The test
figure is `parity:test`'s skipped plus missing.

| Package          | api | tests | What the tests are                                         |
| ---------------- | --: | ----: | ---------------------------------------------------------- |
| actioncable      |   0 |     2 | 2 PERMANENT (visibility)                                   |
| actionmailbox    |   0 |     2 | 2 skips citing a story that is done, plus 1 wrong describe |
| actionmailer     |   0 |     4 | 4 blocked on an operator decision                          |
| activestorage    |   0 |    10 | 7 PERMANENT (cloud-service scope), 3 portable              |
| fugit            |   0 |     1 | 1 upstream pending, no body                                |
| image-processing |   0 |     1 | 1 PERMANENT (visibility)                                   |
| marcel           |   0 |     1 | 1 PERMANENT (rack 2 class, red under MRI on rack 3)        |
| rack-session     |   0 |     1 | 1 PERMANENT (`inherited`)                                  |
| rack-test        |   0 |     1 | 1 portable (disproved, see Design)                         |
| thor             |   0 |     1 | 1 PERMANENT (visibility)                                   |
| tse-compiler     |   0 |     1 | 1 PERMANENT (eval of generated Ruby)                       |
| turbo            |   0 |     1 | 1 blocked on an open trailties story                       |
| solid-cache      |   0 |     2 | 2 PERMANENT (String identity / encoding)                   |
| vite-assets      |   0 |     2 | 2 portable (disproved)                                     |
| vite-trails      |   0 |     1 | 1 PERMANENT (vite_plugin_legacy not ported)                |
| rack             |   0 |     9 | 7 PERMANENT (encoding), 2 owned by open stories            |
| rack-proxy       |   0 |     4 | 1 PERMANENT (String identity), 3 portable                  |
| et-orbi          |   0 |     7 | 7 tests that run but are not credited (title extraction)   |
| actiontext       |   2 |     1 | api: credit/shape; test: PERMANENT (pattern matching)      |
| rake             |   1 |    10 | 5 portable, 5 PERMANENT                                    |
| actionview       |   3 |     — | api only, in scope                                         |
| activerecord     |  36 |     6 | api: 21 mysql2 (RFC 0254) + 15 `adapter_helper.rb`         |
| actionpack       |   8 |    64 | see the actionpack cluster                                 |
| mail             |  10 |    28 | see the mail cluster                                       |
| activesupport    |  45 |    34 | RFC 0246 owns the package; see the activesupport cluster   |

Three things the measurement shows:

- **The two reports disagree about every skip.** `scripts/test-compare/compare.ts:1417`
  scores `matched - matchedSkipped`, so a `PERMANENT-SKIP` counts as a gap.
  `scripts/parity/package-summary.ts:456` writes `testsMatched: t.matched`,
  which includes every skip. So the website shows actioncable's
  `channel/base.rb` as 23/23 and `parity:test` shows 21/23. A `BLOCKED:` skip
  looks finished on the site, and a ratified permanent looks open in CI.
- **Several permanents are not permanent.** The section below lists twelve
  receipts that a run, a grep or an MRI check disproves. The largest is the
  `.builder` handler: 11 actionpack tests are parked because
  `template/handlers/builder.rb` is "unported for want of XmlMarkup". But
  `packages/actionview/lib/template/handlers/builder.ts` ports it, it is
  registered at `handlers.ts:44`, and `@blazetrails/builder` passes 98/98.
- **Several receipts point at dead stories.** Skips cite `BLOCKED:` stories
  that are done (`ascii-8bit-param-encoding-answers-a-js-string-not-bytes`,
  `with-routes-helpers-answers-the-wired-class-itself`) or closed
  (`api-redirect-to-override-and-head-response-are-invented`,
  `action-methods-does-not-subtract-internal-methods`,
  `port-cache-strategy-local-cache`, `cache-lookup-store-has-no-mem-cache-or-redis-store`,
  `date-time-now-and-date-today-allocate-receiver-subclass`).

## Design

### 1. Permanent items are counted apart (cluster `measurement`)

A test is **permanent** when it is `it.skip` under a `PERMANENT-SKIP:` line
that cites a CLAUDE.md section or an operator ruling, or when it is a per-test
`tests:` row in `scripts/parity/unported-files/`. Every other skip is an open
gap, whatever its comment says. API permanence already works. A file or
member in `unported-files` / `SKIP_GROUPS` with a `PERMANENT:` reason leaves
the denominator, and a `@noRailsEquivalent PERMANENT` receipt covers extra
surface.

`parity-reports-permanent-skips-apart-from-open-gaps` makes both reports
agree:

- `parity:test`'s headline prints `implemented / portable (P permanent)`,
  where `portable = total - permanent`, and its percent is over `portable`.
- `package-summary.json`'s `FileRow` gains `testsPermanent`. `testsMatched`
  drops any skip that is not permanent. The website shows the permanent
  count beside the ratio, linked to the `permanentSkips` list the summary
  already writes.
- An upstream test with no body or an upstream `skip` (fugit `@reboot`,
  `vendor/fugit/v1.11.1/spec/cron_spec.rb:1118`; mail's
  `skip "fails randomly"`, `vendor/mail/2.8.1/spec/mail/encodings_spec.rb:531`)
  counts as permanent under a `PERMANENT-SKIP: upstream` line.

`unported-files-package-scope-matches-compare-key` fixes a scoping bug.
`scripts/parity/unported-files/actionpack.ts:5` registers
`dispatch/session/mem_cache_store_test.rb` under `package: "actionpack"`, but
test-compare keys the file as `actiondispatch`, and `isTestFileUnported`
(`index.ts:96-98`) compares the two literally. So 9 tests that are permanent
by owner ruling (Solid stack only, 2026-10-17) still read as missing.

### 2. The permanent list

Every item below was checked against its Rails or gem body. Where the
receipt names a language or runtime fact, the fact is ratified in CLAUDE.md or
by an operator ruling, and no settled idiom gets around it.

| Item                                                                                                                                     | Where                                                                                                                                                                            | Evidence                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| actioncable "should not dispatch a private method", "actions available on Channel"                                                       | `actioncable/test/channel/base_test.rb`                                                                                                                                          | CLAUDE.md "Method visibility is compile-time only"                                                                                                                                                                                                                                                            |
| image-processing "applies thumbnail operation"                                                                                           | `image_processing` `test/mini_magick_test.rb`                                                                                                                                    | same; private `Processor#thumbnail` answers `respond_to?`                                                                                                                                                                                                                                                     |
| thor "raises an error if the method to be invoked is private"                                                                            | `thor` `spec/command_spec.rb`                                                                                                                                                    | same                                                                                                                                                                                                                                                                                                          |
| actionview, actionpack and activerecord private-method tests (9)                                                                         | listed in `permanentSkips`                                                                                                                                                       | same                                                                                                                                                                                                                                                                                                          |
| rake "private reader is private"                                                                                                         | `rake/test/test_private_reader.rb`                                                                                                                                               | same                                                                                                                                                                                                                                                                                                          |
| tse-compiler `BasicObject` / `CaptureBlockEngine` evals                                                                                  | `vendor/erubi/1.13.1/test/test.rb:790`, `:902-1000`                                                                                                                              | CLAUDE.md "Runtime facts", `eval` bullet                                                                                                                                                                                                                                                                      |
| rack-session "should warn when subclassing"                                                                                              | `vendor/rack-session/v2.1.0/test/spec_session_abstract_id.rb:38-53`                                                                                                              | asserts a warn at `Class.new(@id)`, before any read; CLAUDE.md "`inherited` is deferred"                                                                                                                                                                                                                      |
| marcel "…conform to Rack::Lint::InputWrapper"                                                                                            | `vendor/marcel/v1.0.4/test/mime_type_test.rb:41-46`                                                                                                                              | MRI with rack 3.2.8: `defined?(Rack::Lint::InputWrapper)` is `nil`, and `Rack::Lint::Wrapper::InputWrapper` raises `NoMethodError: rewind` at `magic.rb:141`                                                                                                                                                  |
| rack encoding tests (7), solid-cache "retains encoding"                                                                                  | `vendor/rack/v3.2.8/test/spec_multipart.rb`, `spec_files.rb`                                                                                                                     | CLAUDE.md "A String has no encoding tag either"                                                                                                                                                                                                                                                               |
| solid-cache / AS "original store objects should not be immutable", rack-proxy "request body stream read without length fills the buffer" | AS `cache_store_behavior.rb`; rack-proxy `test/rack_proxy_test.rb`                                                                                                               | CLAUDE.md "Ruby Strings are JS string primitives"                                                                                                                                                                                                                                                             |
| actiontext "delegates pattern matching to Nokogiri", actionpack "HTML response pattern matching"                                         |                                                                                                                                                                                  | CLAUDE.md "Ruby pattern matching has no port"                                                                                                                                                                                                                                                                 |
| vite-trails "plugin legacy"                                                                                                              |                                                                                                                                                                                  | CLAUDE.md "importmap-rails and propshaft are out of scope"                                                                                                                                                                                                                                                    |
| activestorage S3 / GCS / Azure (4 skipped, 3 missing)                                                                                    | `activestorage/test/controllers/direct_uploads_controller_test.rb`, `blobs/redirect_controller_test.rb`, `service/configurator_test.rb`                                          | RFC 0209 non-goal, owner scope ruling 2026-10-28                                                                                                                                                                                                                                                              |
| actionpack `mem_cache_store_test.rb` (9 missing), AS `cache_store_setting_test.rb` mem-cache arms (4)                                    |                                                                                                                                                                                  | owner ruling 2026-10-17 (`SOLID_STACK_ONLY`, `unported-files/activesupport.ts:8`)                                                                                                                                                                                                                             |
| AS `fork_tracker_test.rb` (7)                                                                                                            | `fork_tracker_test.rb:9-27` registers `after_fork` in the parent and asserts it runs in the child                                                                                | CLAUDE.md "Runtime facts", `fork`; `rbFFork` starts a fresh heap (`ruby-compat/lib/kernel-fork.ts:13-16`)                                                                                                                                                                                                     |
| AS deprecation proxies "doesnt wrap falsy objects" (3)                                                                                   | `deprecation/proxy_wrappers.rb:6-11`                                                                                                                                             | CLAUDE.md "Runtime facts", `self.new` answering `nil`                                                                                                                                                                                                                                                         |
| AS message-encryptor "backwards compat for 64 bytes key", "…without metadata"                                                            | `message_encryptor_test.rb:56-64`                                                                                                                                                | a Ruby-written Marshal blob; CLAUDE.md "Runtime facts" (2026-11-19)                                                                                                                                                                                                                                           |
| AS `enumerable_test.rb` "doesnt bust constant cache"                                                                                     | `:404` `skip … unless defined?(RubyVM.stat)`                                                                                                                                     | upstream MRI-only                                                                                                                                                                                                                                                                                             |
| rake `execute` ×3                                                                                                                        |                                                                                                                                                                                  | owner ruling trails#9503                                                                                                                                                                                                                                                                                      |
| rake "claim to be a kind of array"                                                                                                       |                                                                                                                                                                                  | CLAUDE.md "Ruby protocol methods" (`is_a?`) plus `packages/rake/CLAUDE.md`                                                                                                                                                                                                                                    |
| rake "default arguments that dont match names are ignored"                                                                               | `test_rake_task_arguments.rb:112-116`: `with_defaults("cc" => …)` then `ta[:cc]` is `nil`                                                                                        | a String and a Symbol key are one JS key; CLAUDE.md "A Ruby Symbol is a JS string" (the receipt is cut off mid-sentence and must cite the section)                                                                                                                                                            |
| actionpack `.builder`-free Marshal / autoload / encoding skips (7)                                                                       | `cookie_store_test.rb`, `cache_store_test.rb`, `request_test.rb`, `multipart_params_parsing_test.rb`, `journey/router/utils_test.rb`, `test_case_test.rb`, `live_stream_test.rb` | CLAUDE.md "`Module#autoload` is a build step" / "A String has no encoding tag"                                                                                                                                                                                                                                |
| actionpack "[APP] instance variable with same name as engine"                                                                            | `prefix_generation_test.rb`                                                                                                                                                      | one JS namespace for fields and methods, the fact the operator ruled on 2026-10-26 for actionview's "rendering with conflicting local vars" (**confirm it covers this test too**)                                                                                                                             |
| mail "should give back an initialized instance … with a unique boundary" ×2                                                              | `vendor/mail/2.8.1/lib/mail/mail.rb:252-259`                                                                                                                                     | MRI 3.3: `something_random` seeds `@@uniq` at `-6`, so the first ~6 boundaries carry a `-` and fail `[\w]+` (196/200 pass, all failures early). The spec passes upstream only when earlier specs have already bumped `uniq`. The receipt says "red under MRI too", which is true only in isolation; reword it |

### 3. Disproved permanents (now PORTABLE)

| Item                                                                                                                       | Receipt claim                                                 | Disproof                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| actionpack `.builder` tests ×11, plus action-pack-assertions' 3 "rendering xml"                                            | `handlers/builder.rb` unported, builder gem not vendored      | `vendor/builder/` exists, `@blazetrails/builder` passes 98/98, and `actionview/lib/template/handlers/builder.ts` is the port, registered at `handlers.ts:44` (`handlers.rb:16`). The `unported-files/actionview.ts:30-38` row is stale                                   |
| rack-test "removes local paths on garbage collection"                                                                      | JS cannot run a finalizer on GC                               | `FinalizationRegistry` plus `v8.setFlagsFromString("--expose-gc")` removed files in 20/20 runs of the spec's shape. Tempfile's `define_finalizer` (`vendor/ruby/v3.3.11/lib/tempfile.rb:299`) has a JS form                                                              |
| rake thread pool ×4                                                                                                        | "a future runs on the event loop; there is no Thread.current" | `packages/rake/lib/thread-pool.ts:86` runs each future on a ruby-compat `Thread`, and `Thread.current()` (`ruby-compat/lib/thread.ts:165`) is AsyncLocalStorage-backed                                                                                                   |
| vite-assets "ruby config file"                                                                                             | `config/vite_public_dir.rb` is Ruby                           | `load_ruby_config` is `Kernel#load` (`vite_ruby/lib/vite_ruby/config.rb:65-67`), which trails ports as `rbFLoad` (CLAUDE.md, migration-file precedent) over a `.ts` config                                                                                               |
| vite-assets "to env"                                                                                                       | reads `Rails.application…asset_host`                          | vite-trails already reads it (`vite-trails/lib/config.ts:10-17`, `vite_rails/config.rb:9`)                                                                                                                                                                               |
| rack-proxy "examples are safe to load", live smoke ×2                                                                      | examples not shipped; network                                 | scope, not language: the examples are four small `Rack::Proxy` subclasses, and the live tests are `LIVE=1`-gated upstream (`live_smoke_test.rb:26-28`). Gate them the same way                                                                                           |
| activestorage "error when attachment's empty" ×3                                                                           | a Proxy miss is a TypeError, not NoMethodError                | `resolve_asset_source` rescues `NoMethodError` into `ArgumentError` (`asset_tag_helper.rb:621-622`). `activemodel/lib/attribute-mutation-tracker.ts:165` already reads `TypeError` as Ruby's `NoMethodError` on `nil` (**contested: confirm the precedent may be used**) |
| AS NullStore "local store strategy", "local store repeated reads"                                                          | closed: only MemCache/Redis include LocalCache                | `null_store.rb:15` is `prepend Strategy::LocalCache`, and trails has `cache/strategy/local-cache.ts`                                                                                                                                                                     |
| AS notifications "subscribe events", "subscribe via top level api", log-subscriber "event attributes"                      | no allocation counter                                         | ratified, but CLAUDE.md says to port the other assertions and receipt only `allocations`                                                                                                                                                                                 |
| mail "allows multiple unencoded strings in …" ×3 (+2 siblings)                                                             | no String encoding tag                                        | the describe already builds ISO-8859-1-tagged `Uint8Array`s (`mail/test/encoding.test.ts:140-144`), and CLAUDE.md allows tagging a `Uint8Array`                                                                                                                          |
| actionmailbox Postmark / Sendgrid non-UTF-8                                                                                | `BLOCKED: ascii-8bit-param-encoding-…`                        | that story is done (trails#10216)                                                                                                                                                                                                                                        |
| actionpack "with routing works with api only controllers", "action methods", "only includes one module with route helpers" | `BLOCKED:` on stories now closed or done                      | each blocker is closed as fixed or done                                                                                                                                                                                                                                  |

### 4. PORTABLE gaps and their owners

Existing stories are adopted as `deps` of each cluster's gate story. New
stories are filed only where nothing owns the gap.

#### small-packages

| Gap                                                                                | Owner                                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| actionmailer ×4                                                                    | adopt `stub-any-instance-does-not-intercept-js-new` (blocked: operator picks the mechanism)                                                                                  |
| turbo ×1                                                                           | adopt `i18n-railtie-initializers-unported` (blocked on `finisher-awaits-async-load-hooks`)                                                                                   |
| rack "delegates keyword arguments to the tempfile" (`spec_multipart.rb:1063-1068`) | adopt `rack-uploaded-file-delegates-keyword-arguments`                                                                                                                       |
| rack "public interface" (`spec_headers.rb:15-20`)                                  | adopt `ruby-compat-hash-answers-rack-headers-public-interface`. Note: the private `downcase_key` still shows at run time, which may leave one arm PERMANENT under visibility |
| actionmailbox ×2 + wrong describe                                                  | new `actionmailbox-unpark-non-utf8-ingress-tests`                                                                                                                            |
| activestorage ×3 portable, ×3 missing to register                                  | new `activestorage-empty-attachment-and-cloud-service-registers`                                                                                                             |
| rack-test ×1                                                                       | new `rack-test-tempfile-finalizer-unlinks-on-gc`                                                                                                                             |
| rake ×4 + receipt + api `private_reader`                                           | new `rake-thread-pool-tests-and-private-reader-credit`                                                                                                                       |
| rack-proxy ×3                                                                      | new `rack-proxy-port-examples-and-live-smoke-tests`                                                                                                                          |
| vite-assets ×2                                                                     | new `vite-assets-ruby-config-and-to-env-tests`                                                                                                                               |
| et-orbi ×7                                                                         | new `et-orbi-iso8601-titles-credited`                                                                                                                                        |
| actiontext api ×2 (`rich_textarea`, `rich_text_area`, `tag_helper.rb`)             | new `actiontext-rich-textarea-credited-on-form-helper`                                                                                                                       |
| actionview api ×3 (`assert_size_match!` ×2, `HTMLSelector.context`)                | new `actionview-dom-testing-assert-size-match-and-context`                                                                                                                   |

#### activerecord

| Gap                                                                                              | Owner                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| api: mysql2 `client.rb` ×8, `em.rb` ×6, `field.rb` ×5, `mysql2.rb` ×1, `result.rb` ×1            | RFC 0254 `mysql2-gem-port` (`deps-rfc`). Also `declaration-only-mysql2-client-readers-and-struct-attributes-writer` (0156) |
| api: `adapter_helper.rb` `supports_*?` ×15 (`activerecord/test/support/adapter_helper.rb:23-60`) | adopt `activerecord-test-support-helper-stand-ins-and-harness` (0189, draft)                                               |
| "async load has many / belongs to / has one"                                                     | adopt `association-async-load-target-uses-async-executor`                                                                  |
| "scheduled?"                                                                                     | adopt `load-async-mixed-pool-scheduled-test-needs-a-synchronous-null-executor-load`                                        |
| "changing columns", "changing column null with default"                                          | adopt `postgresql-bulk-change-query-count-one-short` (claimed)                                                             |
| "load async instrumentation is thread safe" (`relation/load_async_test.rb:161-195`)              | new `load-async-instrumentation-is-thread-safe`                                                                            |

#### actionpack

| Gap                                                                                     | Owner                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.builder` ×11 + action-pack-assertions xml ×3                                          | new `builder-handler-is-ported-unpark-builder-template-tests`; rewrite the builder half of `action-pack-assertions-port-render-file-tests-and-park-the-builder-three` (its "park" criterion rests on the stale row) |
| render file ×2                                                                          | adopt `action-pack-assertions-port-render-file-tests-and-park-the-builder-three`                                                                                                                                    |
| cookies ×11                                                                             | adopt `cookie-jar-serializer-fallbacks-and-legacy-cbc-upgrade`                                                                                                                                                      |
| debug-exceptions ×10                                                                    | adopt `debug-view-rescue-templates-are-never-shipped`                                                                                                                                                               |
| "routes when expanded"                                                                  | adopt `inspector-routes-when-expanded-colocated-source-location` (blocked on an owner decision)                                                                                                                     |
| "helper typo error message", "exceptions have suggestions for fix"                      | adopt `helper-name-error-has-no-did-you-mean`, `port-did-you-mean-correctable-onto-name-error`                                                                                                                      |
| api only routing, action methods, route helpers                                         | new `actionpack-unpark-tests-whose-blocker-landed`                                                                                                                                                                  |
| api `http/rack_cache.rb` ×6 + "stuff is deep duped"                                     | adopt `port-rails-meta-and-entity-stores`. it depends on RFC 0168 (reactivated 2026-11-20)                                                                                                                          |
| api `test_case.rb` `original_new_controller_thread` / `original_clean_up_thread_locals` | new `action-controller-test-case-live-aliases-on-live`                                                                                                                                                              |
| 9 mem-cache missing                                                                     | measurement story (scope fix)                                                                                                                                                                                       |

#### mail

| Gap                                                                                                                                                                                                                          | Owner                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| api: `error=` on 10 `parsers/*_parser.rb` Structs                                                                                                                                                                            | new `mail-parser-structs-credit-error-writer`        |
| 17 missing: duplicate-named tests in other describes (`encodings_spec.rb:134/272/346`, `:148/:483`), `<expr>` loop titles (`encoding_spec.rb:161`, `quoted_printable_spec.rb`), address titles with `\"` (`address_spec.rb`) | new `mail-test-compare-residue-titles-and-describes` |
| latin-1 encoding describe (5 skips)                                                                                                                                                                                          | new `mail-latin1-encoding-tests-use-tagged-bytes`    |

#### activesupport

RFC 0246 owns this package, and its gate `activesupport-parity-100-gate`
already defines 100%. This cluster only adds `deps-rfc` on 0246. New
activesupport findings are filed **into 0246**, not here:

| Gap                                                                                                                                                                                                                                    | Owner                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api ×32: `dependencies.rb`, `cache/coder.rb`, `core_ext/*`, `duration.rb`, `json/encoding.rb`, `multibyte/chars.rb`, `current_attributes.rb`, `encrypted_configuration.rb`, `execution_wrapper.rb`, `ordered_options.rb`, `xml_mini/*` | adopt `activesupport-api-misses-remainder-after-bundle`                                                                                                                   |
| api `fork_tracker.rb#_fork`                                                                                                                                                                                                            | adopt `activesupport-fork-tracker-hook-singleton-prepend`; `_fork` may also be the extractor skipping `_` names                                                           |
| api `acts_like_string?`, `descendants_tracker.rb` ×2                                                                                                                                                                                   | adopt `string-instance-answers-the-string-method-table`, `descendants-tracker-singletons-dispatch-to-klass`                                                               |
| api `cache.rb` `format_version` ×2, `compact_blank!`, `rescuable.rb` `rescue_handlers` ×6                                                                                                                                              | new, into 0246: `activesupport-api-format-version-compact-blank-rescue-handlers`                                                                                          |
| time-ext ×3                                                                                                                                                                                                                            | adopt `activesupport-time-new-timezone-object-argument`, `activesupport-time-to-datetime-start-and-to-time`                                                               |
| time-travel subclass                                                                                                                                                                                                                   | adopt `time-date-class-methods-allocate-receiver-subclass` (its receipt is retargeted from the closed duplicate by `parity-reports-permanent-skips-apart-from-open-gaps`) |
| NullStore local cache ×2                                                                                                                                                                                                               | new, into 0246: `null-store-prepends-local-cache`                                                                                                                         |
| notifications / log-subscriber ×3                                                                                                                                                                                                      | new, into 0246: `notifications-tests-port-all-but-allocations`                                                                                                            |
| json-gem-encoding ×2, pathname blank                                                                                                                                                                                                   | new, into 0246: `json-gem-encoding-and-pathname-blank-tests` (overlaps `json-encoding-test-ports-data-json-gem-and-io-arms`, so merge if the operator prefers)            |
| "log at only impact receiver"                                                                                                                                                                                                          | the TS test is renamed "…impacts…" (`activesupport/test/logger.test.ts:189`); restore the Rails name. Fold into the 0246 story above                                      |
| "#signature? handles non-ASCII-only non-binary-encoded strings" (`message_pack/shared_serializer_tests.rb:44-47`)                                                                                                                      | fold into the same 0246 story                                                                                                                                             |
| mem-cache `cache_store_setting` ×4                                                                                                                                                                                                     | measurement story (convert the stale `BLOCKED:` to unported `tests:` rows)                                                                                                |

### 5. Receipts that must change

Each of these is a story acceptance item, not a separate story:

- `BLOCKED:` lines that cite a done or closed story are rewritten, or the test
  is unparked.
- Truncated `PERMANENT-SKIP:` lines (rake task-arguments, vite-assets ×2,
  rack-test) are completed with a CLAUDE.md citation, or the test is unparked.
- `PERMANENT-SKIP:` receipts with no CLAUDE.md citation get one, or an
  operator-ruling reference: rack-proxy examples and live smoke, marcel,
  fugit, activestorage cloud services, message-encryptor (it cites the old
  `scripts/api-compare/unported-files.ts` path).
- `unported-files/actionview.ts:30-38` (`template/handlers/builder.rb`) is
  deleted. Also check `helpers/atom_feed_helper.rb` (`:40-48`), whose reason
  rests on the same claim.

## Non-goals

- **nokogiri, sqlite3, pg, tzinfo, html-sanitizer, i18n, msgpack,
  solid-queue, trailties tests, ruby-compat**: separate projects (operator,
  2026-11-20).
- **mysql2's 21 API rows**: counted under activerecord but owned by RFC 0254.
- **actionview's 34 skipped tests**: all `PERMANENT-SKIP` with a CLAUDE.md
  citation except `test_case_test.rb`'s four, which are PERMANENT too
  (initialize inlining, pattern matching). The measurement story moves them
  out of the open count; nothing to port.
- **memcached / Redis**: Solid stack only by owner ruling (2026-10-17).

## Alternatives considered

- **File every activesupport item here.** Rejected: RFC 0246 is active and
  defines the same 100%, so a parallel cluster would split one gate across two
  RFCs.
- **Treat every skip as matched, as the website does.** Rejected: that hides
  20+ portable tests parked under stale `BLOCKED:` lines.
- **Treat every skip as a gap, as `parity:test` does.** Rejected: 100% would
  then be unreachable for twelve packages whose only remainder is ratified.

## Rollout

1. `measurement`: `parity-reports-permanent-skips-apart-from-open-gaps`,
   `unported-files-package-scope-matches-compare-key`.
2. `small-packages`, then the four large clusters, in any order.
3. `last-mile-parity-gate` holds each package at 100% of portable with every
   skip permanent.

## Verification

`last-mile-parity-gate` closes the RFC when all of these hold:

- Each in-scope package except activesupport (which 0246 gates) reports
  100% of portable on `parity:test` and 0 missing on `parity:api`, with
  mysql2 left to RFC 0254 and rack-cache to RFC 0168.
- Each package's `permanent` count equals the `PERMANENT-SKIP` + unported
  `tests:` rows, and no skip outside it remains.
- No `BLOCKED:` line cites a story whose status is `done` or `closed`.

## Open questions

1. **rack-cache.** Resolved 2026-11-20: the operator reactivated RFC 0168,
   so `port-rails-meta-and-entity-stores` stays PORTABLE.
2. **TypeError as `rescue NoMethodError`.** Does the
   `attribute-mutation-tracker.ts:165` precedent license
   `resolve_asset_source` to rescue `TypeError`? Recommendation: yes, with an
   `@inventedArm` receipt. Otherwise the 3 activestorage tests are PERMANENT.
3. **`ActionDispatch::Session::MemCacheStore`.** `port-mem-cache-store-test`
   and `memcachestore-descends-from-rack-session-dalli` are still open against
   the 2026-10-17 Solid-only ruling. Recommendation: close both `PERMANENT:`.
   `unported-files-package-scope-matches-compare-key` carries both outcomes.
4. **prefix-generation ivar test.** Does the 2026-10-26 ruling (one JS
   namespace for an ivar and a method) cover
   "[APP] instance variable with same name as engine"? Either way
   `actionpack-unpark-tests-whose-blocker-landed` acts on the answer.
5. **mail unique-boundary specs.** PERMANENT (red in isolation under MRI), or
   port them with enough prior `random_tag` calls to match the upstream suite
   order? Recommendation: PERMANENT, with the receipt reworded.
   `mail-test-compare-residue-titles-and-describes` carries both outcomes.

## Changelog

- 2026-11-20: initial RFC
- 2026-11-20: RFC 0168 reactivated; rack-cache open question resolved
- 2026-11-20: stories filed: 19 here, 4 into RFC 0246 (`activesupport-api-format-version-compact-blank-rescue-handlers`,
  `null-store-prepends-local-cache`, `notifications-tests-port-all-but-allocations`,
  `json-gem-encoding-and-pathname-blank-tests`)
- 2026-11-20: review fixes: 0246's gate and Rollout include the four new
  stories; the time-travel receipt retarget and open questions 3–5 have
  conditional owners.
