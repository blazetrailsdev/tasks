---
rfc: "0164-actiondispatch-http-parity"
title: "ActionDispatch HTTP — Request, Response, Mime and params parsing to parity"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0164 — ActionDispatch HTTP: Request, Response, Mime and params parsing to parity

## Summary

Take `action_dispatch/http/**` and `action_dispatch/request/**` — `Request`
and its mixins (`Cache`, `MimeNegotiation`, `Parameters`, `FilterParameters`,
`URL`), `Response`, `Headers`, `Mime::Type`, `ParamBuilder`, `QueryParser`,
`ContentSecurityPolicy`, `PermissionsPolicy`, `Request::Utils`,
`Request::Session`, and `http/rack_cache.rb` — to 100% on every parity axis, and
port the `dispatch/request*`, `dispatch/response*`, mime, params-parsing and
policy test files.

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement fixes and gate enrollment).

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

**API** (`pnpm parity:api --package actiondispatch`), the rows under 100%:

| Rails file                   | Methods | Gap                                                                                                                                  |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `http/permissions_policy.rb` | 13/35   | **22 phantom rows** — see below                                                                                                      |
| `http/url.rb`                | 25/38   | `secure_protocol` (4), and 7 declaration-only rows whose bodies sit on `request.ts`                                                  |
| `http/response.rb`           | 86/94   | `default_charset` / `default_headers` (4), `prepare!` (`:414`), `ContentTypeHeader#mime_type` / `=` (`:434`), `call` (`:530`)        |
| `http/rack_cache.rb`         | 0/6     | the whole file (`RailsMetaStore`, `RailsEntityStore`)                                                                                |
| `request/utils.rb`           | 7/12    | `perform_deep_munge` (2), `ParamEncoder.handle_array` (`:71`), `CustomParamEncoder.encode_for_template` (`:86`) / `.encode` (`:101`) |
| `http/cache.rb`              | 26/30   | `strict_freshness` (4)                                                                                                               |
| `http/param_builder.rb`      | 18/22   | `ignore_leading_brackets`, `default` (4)                                                                                             |
| `http/request.rb`            | 130/134 | `strict_freshness`, `secure_protocol` (4)                                                                                            |
| `http/mime_negotiation.rb`   | 17/19   | `ignore_accept_header` (2)                                                                                                           |
| `http/mime_type.rb`          | 33/35   | `Mime.symbols`, `Mime.valid_symbols?` (`:56-60`)                                                                                     |
| `http/query_parser.rb`       | 3/5     | `strict_query_string_separator` (2)                                                                                                  |
| `http/headers.rb`            | 10/11   | `include?`                                                                                                                           |

The 22 `permissions_policy.rb` rows are `base_uri`, `child_src`, … — the
directives of `ContentSecurityPolicy::DIRECTIVES`
(`http/content_security_policy.rb:149`), not of `PermissionsPolicy::DIRECTIVES`
(`http/permissions_policy.rb:84`, `accelerometer`, `camera`, …), which trails
ports correctly. The API extractor resolves the bare `DIRECTIVES` in
`permissions_policy.rb:122`'s `DIRECTIVES.each { define_method … }` to the first
class holding a constant of that name
(`scripts/api-compare/extract-ruby-api.rb:2565-2581`). That is RFC 0167's
`api-extractor-resolves-bare-constants-lexically`; this RFC does not touch it.

Also: arity `parse_formatted_parameters(parsers)` against trails'
`(parsers, fallback)`, on both `http/parameters.rb` and `http/request.rb`; the
one actiondispatch arm-throw row (`http/request.ts`); two inheritance rows
(`MimeNegotiation::InvalidType < Mime::Type::InvalidMimeType`,
`mime_negotiation.rb:12`; `Request::Utils` missing as a class).

**Extra surface** (ungated): `http/mime-type.ts` 24 novel (the `HTML`, `JSON`, …
constants Rails 8 does not define, plus `onRegister`, `toStr`),
`http/response.ts` 4 novel (`[Symbol.iterator]`, `[Symbol.asyncIterator]`,
`ResponseBuffer`, `toRack`) and 3 moved, `http/content-security-policy.ts` 4
novel, `http/request.ts` 2 novel and 18 moved (the cookie-jar readers Rails
defines in `middleware/cookies.rb:12-91`'s `class Request` reopening, and
`flash`), `request/utils.ts` 2 novel, `http/param-error.ts` 1 novel
(`[Symbol.hasInstance]`), and moved names on `mime-negotiation.ts` (9),
`cache.ts` (3), `headers.ts` (2), `parameters.ts` (2).

**Call baselines:** 20 rows under `call-mismatches-exclude/actiondispatch/`:
`http/request.json` 4, `http/mime-type.json` 3, `http/param-builder.json` 3,
`http/cache.json` 2, `http/content-security-policy.json` 2,
`http/filter-parameters.json` 2, `http/content-disposition.json` 1,
`http/query-parser.json` 1, `http/response.json` 1, `request/session.json` 1.

**Tests** (`pnpm parity:test --package actiondispatch`):

| Rails test file                                                        | Rails | OK  | Skip | Misplaced | Missing | Extra |
| ---------------------------------------------------------------------- | ----- | --- | ---- | --------- | ------- | ----- |
| `dispatch/request_test.rb`                                             | 121   | 93  | 28   | 0         | 0       | 30    |
| `dispatch/response_test.rb`                                            | 53    | 37  | 16   | 0         | 0       | 45    |
| `dispatch/request/{json,multipart,url_encoded}_params_parsing_test.rb` | 40    | 0   | 0    | 0         | 40      | 0     |
| `dispatch/request/query_string_parsing_test.rb`                        | 17    | 0   | 0    | 16        | 1       | 0     |
| `dispatch/query_parser_test.rb`                                        | 9     | 0   | 0    | 8         | 1       | 0     |
| `dispatch/param_builder_test.rb`                                       | 6     | 0   | 0    | 4         | 2       | 0     |
| `dispatch/content_disposition_test.rb`                                 | 5     | 0   | 0    | 5         | 0       | 0     |
| `dispatch/content_security_policy_test.rb`                             | 36    | 32  | 1    | 3         | 0       | 30    |
| `dispatch/mime_type_test.rb`                                           | 32    | 27  | 0    | 0         | 5       | 6     |
| `dispatch/permissions_policy_test.rb`                                  | 12    | 3   | 0    | 0         | 9       | 10    |
| `dispatch/live_response_test.rb`                                       | 10    | 0   | 0    | 0         | 10      | 0     |
| `dispatch/request/session_test.rb`                                     | 22    | 21  | 0    | 0         | 1       | 4     |
| `dispatch/rack_cache_test.rb`                                          | 1     | 0   | 0    | 0         | 1       | 0     |
| `dispatch/header_test.rb`, `dispatch/uploaded_file_test.rb`            | 39    | 39  | 0    | 0         | 0       | 0     |

The misplaced tests live in `http/*.test.ts` and `request/*.test.ts` beside the
source; the convention path is `dispatch/…`.

## Design

### Config seats use `mattrAccessor` / `cattrAccessor`

Ten seats — `strict_freshness` (`cache.rb:12`), `ignore_accept_header`
(`mime_negotiation.rb:20`), `secure_protocol` / `tld_length` (`url.rb:14-15`),
`strict_query_string_separator` (`query_parser.rb:12`),
`ignore_leading_brackets` / `default` (`param_builder.rb:19,23`),
`default_charset` / `default_headers` (`response.rb:88-89`) and
`perform_deep_munge` (`request/utils.rb:10`) — are plain fields today. They use
the activesupport primitive at the Rails declaration site, as
`middleware/exception-wrapper.ts:72` already does.

### A module's body lives in the module's file

`pnpm parity:api:extra` reports 19 `Request` members as "inlined" from
`http/url.rb`, `mime_negotiation.rb`, `parameters.rb`, `filter_parameters.rb`
and `permissions_policy.rb`, and two `Response` members from `cache.rb` and
`filter_redirect.rb`. Per
CLAUDE.md § "Module mixins", each moves to its Rails file as a `this`-typed
function assigned to `Request` / `Response`. The cookie-jar readers go the same
way, into `middleware/cookies.ts`'s `Request` reopening.

### `rack_cache.rb` needs the rack-cache gem

`RailsMetaStore < Rack::Cache::MetaStore` and `RailsEntityStore <
Rack::Cache::EntityStore` (`http/rack_cache.rb:12,36`) subclass a gem that is
not vendored. The gem itself now has its own RFC, `rack-cache-gem-port`,
which follows the `rack` / `rack-session` / `rack-test` precedent. It vendors
rack-cache at the version Rails' `Gemfile.lock` pins (`rack-cache (1.17.0)`,
`vendor/rails/v8.0.2/Gemfile.lock:434`) and ports it as
`@blazetrails/rack-cache`. This RFC keeps only the two Rails subclasses:
`port-rails-meta-and-entity-stores` depends on that RFC's
`port-rack-cache-storage`.

### Prior art folded in by reference

| Story                                                                                                                                                                                                                                                                                                                                                           | RFC  | Covers                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------- |
| `mime-registry-splits-into-lookup-and-extension-lookup`                                                                                                                                                                                                                                                                                                         | 0141 | `Mime::LOOKUP` / `EXTENSION_LOOKUP`                                     |
| `parity-api-credits-mime-module-singleton-methods`                                                                                                                                                                                                                                                                                                              | 0141 | `Mime.symbols` / `Mime.valid_symbols?` crediting                        |
| `port-mime-alltype-singleton`, `mime-type-equals-ignores-synonyms`, `mimes-delete-if-keeps-symbols-identity`, `lookup-by-extension-strips-an-invented-leading-dot`                                                                                                                                                                                              | 0141 | `Mime::Type`                                                            |
| `headers-include-alias-and-merge-dups-request`                                                                                                                                                                                                                                                                                                                  | 0141 | `Headers#include?`                                                      |
| `parse-formatted-parameters-guard-and-parser-key`                                                                                                                                                                                                                                                                                                               | 0141 | `parse_formatted_parameters` (and its arity)                            |
| `raw-post-byte-form-body-parses-as-utf8`                                                                                                                                                                                                                                                                                                                        | 0141 | `raw_post`                                                              |
| `response-location-returns-empty-string-not-nil`                                                                                                                                                                                                                                                                                                                | 0141 | `Response#location`                                                     |
| `uploaded-file-initialize-drops-the-utf-8-re-encode-arms`                                                                                                                                                                                                                                                                                                       | 0141 | `UploadedFile` (blocked; `uploaded_file_test.rb` already reports 20/20) |
| `get-header-must-not-apply-headers-env-name-conversion`, `request-clones-its-env-rails-wraps-by-reference`, `request-constructor-rack-minimums-vs-mock-request-env-for`, `weak-strong-etag-predicates-return-boolean-not-nil`, `port-response-file-body`, `path-parameters-writer-drops-check-param-encoding`, `mime-negotiation-format-reader-arity-vs-getter` | 0023 | `Request` / `Response` bodies                                           |

## Non-goals

- **Middleware** that reads these classes (`cookies.rb`, `flash.rb`,
  `ssl.rb`, `remote_ip.rb`, `host_authorization.rb`, …) — RFC 0165 (middleware),
  except for the `class Request` reopenings named above.
- **The extractor defect behind the 22 phantom rows** — RFC 0167 (gates).

## Alternatives considered

- **Mark `rack_cache.rb` unported.** Rails ships it and `test/dispatch/rack_cache_test.rb`
  tests it; an unported-files entry would be a permanent hole in the 100%.
- **Keep `Mime::HTML`-style constants as convenience.** Rails removed them;
  `Mime[:html]` is the Rails spelling.

## Rollout

1. API — `http-config-seats-onto-mattr-accessor`,
   `request-mixin-bodies-onto-their-rails-files`,
   `mime-type-invented-constants-and-invalid-type-parent`,
   `response-invented-iterators-buffer-and-missing-members`,
   `request-utils-param-encoders-and-deep-munge`,
   `content-security-policy-and-http-moved-names`,
   `port-rails-meta-and-entity-stores`
2. Tests — `move-misplaced-http-tests-to-dispatch-convention`,
   `port-json-and-url-encoded-params-parsing-tests`,
   `port-multipart-params-parsing-test`, `port-request-test-skips`,
   `port-response-test-skips`, `port-mime-type-and-permissions-policy-tests`,
   `port-live-response-and-small-http-tests`
3. Close — `http-call-baselines-and-residue`

## Verification

- `pnpm parity:api --package actiondispatch` reports every `http/*.rb` and
  `request/*.rb` row at 100% (`permissions_policy.rb` once RFC 0167's
  extractor fix lands), with no arity, inheritance or arm-throw row on them.
- `pnpm parity:api:extra --package actiondispatch` lists no novel name under
  `http/` or `request/`, apart from receipted `[Symbol.hasInstance]` hooks
  (CLAUDE.md § "Ruby protocol methods with a different JS mechanism").
- No row remains in the ten call baseline shards above.
- `pnpm parity:test --package actiondispatch` reports every file in the tests
  table complete, with no extra.

## Open questions

1. **Vendor rack-cache?** _Resolved:_ yes, as its own package under the
   `rack-cache-gem-port` RFC, not as base classes inside actionpack.
   `port-rails-meta-and-entity-stores` is narrowed to `http/rack_cache.rb` and
   its test, and it depends on that RFC.

## Changelog

- 2026-09-27: initial RFC
- 2026-09-27: re-measured on trails `main` @ `2558bb83f4`; no change to this RFC's rows.
- 2026-09-28: Open question 1 resolved. The rack-cache gem moved to RFC
  the `rack-cache-gem-port` RFC, and `port-rails-meta-and-entity-stores` was
  narrowed to the Rails subclasses.
