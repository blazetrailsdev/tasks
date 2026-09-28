---
rfc: "0162-actioncontroller-metal-parity"
title: "ActionController metal and AbstractController — the non-rendering modules to parity"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0162 — ActionController metal and AbstractController: the non-rendering modules to parity

## Summary

Take every `ActionController` / `AbstractController` module that is not
rendering and not the test harness to 100% on every parity axis:
`abstract_controller/{base,caching,caching/fragments,callbacks,collector,helpers,translation,url_for,asset_paths,logger,error}.rb`,
`action_controller/{base,metal,api,caching,log_subscriber}.rb` and
`action_controller/metal/{allow_browser,conditional_get,content_security_policy,cookies,data_streaming,default_headers,etag_with_flash,etag_with_template_digest,exceptions,flash,head,helpers,http_authentication,instrumentation,logging,mime_responds,parameter_encoding,params_wrapper,permissions_policy,rate_limiting,redirecting,request_forgery_protection,rescue,strong_parameters,url_for}.rb`
— and port the controller tests that exercise them.

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement fixes and gate enrollment); the rendering modules and the test harness
have their own.

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

**API.** `actioncontroller` is 641/735 (87.2%) and `abstractcontroller` 95/132
(72.0%). Outside the rendering and test-harness files the gap is 100 method
rows, in three kinds:

- **Config seats not on the Rails primitive (66 rows).** Rails declares them with
  `class_attribute` / `mattr_accessor` / `cattr_accessor`; trails has a plain
  static field, so the generated reader, writer and predicate score missing:
  `etaggers` (`conditional_get.rb:15`, 15 rows across four files),
  `etag_with_template_digest` (`etag_with_template_digest.rb:31`),
  `middleware_stack` (`metal.rb:288`), `raise_on_open_redirects`
  (`redirecting.rb:17`), `include_all_helpers` (`helpers.rb:71`),
  `always_permitted_parameters` (`strong_parameters.rb:263`), `_wrapper_options`
  (`params_wrapper.rb:185`), and on AbstractController `_view_cache_dependencies`
  (`caching.rb:44`), `fragment_cache_keys` (`caching/fragments.rb:26`),
  `raise_on_missing_callback_actions` (`callbacks.rb:36`) and `_helper_methods`
  (`helpers.rb:13`). The settled idiom already exists —
  `cattrAccessor.call(this, "rescueResponses", …)` in
  `action-dispatch/middleware/exception-wrapper.ts:72`, and `classAttribute()`.
- **Whole Rails modules folded away.** `HttpAuthentication::Token`
  (`metal/http_authentication.rb:425-560`) is absent from
  `metal/http-authentication.ts`: it lives as `TokenAuth` in the invented
  `action-dispatch/http-authentication.ts`, which also holds `BasicAuth` /
  `DigestAuth` copies. `metal/http-authentication.ts` flattens Rails' `Basic` /
  `Digest` modules into prefixed functions (`digestAuthenticate`,
  `encodeDigestCredentials`, …).
- **Single methods.** `Metal#response_code` (`metal.rb:227`, an alias of
  `status`) and `#to_a` (`:280`); `AbstractController::Base#controller_path`
  (`base.rb:167`), `#action_methods` (`:172`), `#inspect` (`:204`) and
  `send_action` (`:233`); `AllowBrowser::ClassMethods#allow_browser`
  (`allow_browser.rb:57`); `Parameters#required` (`strong_parameters.rb:529`),
  `#as_json` (`:251`), `#init_with` (`:1068`), `#encode_with` (`:1086`),
  `#initialize_copy` (`:1434`); AbstractController `modules_for_helpers`,
  `all_helpers_from_path`, `helper_modules_from_paths` (`helpers.rb:33-57`).

Arity: five rows on `abstract_controller/helpers.rb`, two on
`action_controller/{log_subscriber,metal/flash}.rb`.

**Extra surface** (`pnpm parity:api:extra`, ungated): 43 novel names on
files this RFC owns — invented registries (`FlashTypeRegistry`, `RescueRegistry`,
`ParameterEncodingRegistry`, `MemoryRateLimitStore`), helpers
(`buildCacheControl`, `getEtaggers`, `clearEtaggers`, `templateEtagger`,
`flashEtagger`, `headResponse`, `applyDefaultHeaders`,
`applyPermissionsPolicy`, `resolveStatus`, `toRackResponse`, …) and the
`action-controller/index.ts` barrel (`applyParamsWrapper`, `deriveWrapperKey`,
`inheritedWithHelpers`, `isRateLimited`, `wrapParameters`). Plus 7 novel / 7
moved on `action-dispatch/http-authentication.ts`.

**Call baselines:** 58 rows — `base.json` 18, `metal/strong-parameters.json` 17,
`metal/request-forgery-protection.json` 6, `metal/conditional-get.json` 3,
`metal/http-authentication.json` 3, `metal/params-wrapper.json` 3,
`metal/{data-streaming,flash,mime-responds,redirecting}.json` 1 each (actioncontroller),
and `helpers.json` 4 (abstractcontroller).

**Tests** (`pnpm parity:test --package actioncontroller`), for the files this
RFC owns:

| Rails test file                                                                                                                                 | Rails | OK  | Skip | Missing/misplaced |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ---- | ----------------- |
| `render_test.rb` (80 of 88 are HTTP caching)                                                                                                    | 88    | 0   | 0    | 88                |
| `mime/respond_to_test.rb`                                                                                                                       | 66    | 30  | 0    | 36                |
| `request_forgery_protection_test.rb`                                                                                                            | 102   | 49  | 53   | 0                 |
| `filters_test.rb`                                                                                                                               | 52    | 17  | 4    | 31                |
| `caching_test.rb`                                                                                                                               | 32    | 0   | 32   | 3 wrong describe  |
| `params_wrapper_test.rb`, `api/params_wrapper_test.rb`                                                                                          | 31    | 0   | 0    | 31                |
| `http_token_authentication_test.rb`, `http_digest_authentication_test.rb`                                                                       | 43    | 0   | 0    | 43                |
| `helper_test.rb`                                                                                                                                | 22    | 0   | 0    | 22                |
| `new_base/bare_metal`, `new_base/base`, `new_base/middleware`                                                                                   | 39    | 0   | 0    | 39                |
| `base_test.rb`, `flash_test.rb`, `log_subscriber_test.rb`                                                                                       | 79    | 44  | 35   | 0                 |
| `api/*` (6 files, excluding params_wrapper, renderers, implicit_render, url_for)                                                                | 17    | 0   | 0    | 17                |
| `redirect_test.rb`, `send_file_test.rb`, `required_params_test.rb`, `metal_test.rb`, `mime/accept_format_test.rb`                               | 105   | 74  | 0    | 31                |
| `logging`, `parameter_encoding`, `parameters_integration`, `params_parse`, `permitted_params`, `rate_limiting`, `show_exceptions`, `webservice` | 38    | 0   | 0    | 38                |

Ten of these rows are phantoms — controller actions named `test_*` in
`send_file_test.rb` (6) and `parameter_encoding_test.rb` (4); RFC 0167's
`ruby-extractor-counts-controller-test-actions` removes them.

## Design

### Config seats use the activesupport primitives

Every `class_attribute` ports through `classAttribute()`, every
`mattr_accessor` / `cattr_accessor` through `mattrAccessor` / `cattrAccessor`
from `@blazetrails/activesupport`, called at the Rails declaration site. That is
what CLAUDE.md § "Module mixins" prescribes for `included do class_attribute`,
and `exception-wrapper.ts:72` is the precedent `parity:api` already credits.

### HttpAuthentication is three modules, as in Rails

`Basic`, `Digest` and `Token` become namespace objects in
`metal/http-authentication.ts`, each carrying its Rails functions under their
Rails names and its own `ControllerMethods`. The prefixed flat functions and
`action-dispatch/http-authentication.ts` go away.

### Invented registries fold into Rails' state

Each invented registry stands in for state Rails keeps in a `class_attribute`
or a constant (`_flash_types`, `rescue_handlers`, `_parameter_encodings` …). The
registry is replaced by that attribute; nothing is receipted.

### Prior art folded in by reference

These open stories already own part of this RFC's surface. The RFC depends on
them and does not restate them:

| Story (RFC 0141 unless noted)                                                                                      | Covers                                                         |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `port-wrap-parameters-class-macro`                                                                                 | `wrap_parameters`, `_wrapper_options`                          |
| `port-helper-attr`, `port-the-controller-helper-proxy`                                                             | `helper_attr`, `helpers`                                       |
| `port-action-controller-helpers-and-the-inherited-hook`                                                            | `Railties::Helpers#inherited`                                  |
| `helper-method-is-not-a-class-method`, `helper-name-error-has-no-did-you-mean`                                     | `helper_method`, helper `NameError`                            |
| `append-action-aliases-missing`                                                                                    | `append_*_action`                                              |
| `model-response-cache-control-hash-for-expires-in-and-fresh-when`                                                  | `expires_in` / `fresh_when`                                    |
| `converge-metal-status-setter-onto-response-status`                                                                | `Metal#status=`                                                |
| `wire-parameter-encoding-onto-metal-action-encoding-template`                                                      | `ParameterEncoding`                                            |
| `split-redirect-to-into-redirecting-and-flash`                                                                     | `redirect_to`, `add_flash_types`                               |
| `send-data-and-send-file-do-not-render`, `send-file-headers-raises-typeerror-not-argumenterror`                    | `DataStreaming`                                                |
| `strong-parameters-fetch-raises-keyerror-not-parameter-missing`, `permit-value-is-missing-the-explicit-arrays-arm` | `Parameters`                                                   |
| `converge-mime-responds-collector-responses-hash`, `port-respond-to-controller-variant-tests`                      | `MimeResponds`                                                 |
| `delete-invented-action-dispatch-respond-to-and-csrf-modules`                                                      | the invented `respond-to.ts` / `request-forgery-protection.ts` |
| `action-callbacks-invented-name-option-shadows-symbol-filter-dedup`                                                | `before_action` dedup                                          |
| `skip-forgery-protection-is-not-a-controller-class-method`                                                         | `skip_forgery_protection`                                      |
| `negotiate-mime-include-crashes-on-nil-order-entry`                                                                | `MimeResponds#negotiate_mime`                                  |
| `respond-to-negotiated-format-never-reaches-lookup-context` (0140)                                                 | `respond_to` → lookup context                                  |
| `burn-down-and-enroll-abstractcontroller` (0120)                                                                   | abstractcontroller's extra-surface gate                        |

### Prior-art status (trails `main` @ `2558bb83f4`)

Already landed: `action-callbacks-invented-name-option-shadows-symbol-filter-dedup`,
`append-action-aliases-missing`, `converge-metal-status-setter-onto-response-status`,
`converge-mime-responds-collector-responses-hash` and
`respond-to-negotiated-format-never-reaches-lookup-context`. Blocked:
`helper-name-error-has-no-did-you-mean` (on RFC 0154's
`port-did-you-mean-correctable-onto-name-error`). `append-action-aliases-missing`
put the aliases on `abstract-controller/base.ts:237`; Rails defines them in
`callbacks.rb:252`, so the three rows still read missing —
`abstract-controller-class-attributes-and-helper-resolution` moves them.

## Non-goals

- **Rendering modules** (`metal/rendering.rb`, `renderers.rb`, `streaming.rb`,
  `live.rb`, `implicit_render.rb`, `renderer.rb`, `api/api_rendering.rb`,
  `form_builder.rb`, `abstract_controller/rendering.rb`) — RFC 0161 (controller rendering).
- **`test_case.rb` and `metal/testing.rb`** — RFC 0160 (test harness).
- **URL generation tests** (`url_for_test.rb`, `url_for_integration_test.rb`,
  `api/url_for_test.rb`, `default_url_options_with_before_action_test.rb`,
  `route_helpers_test.rb`) — RFC 0163 (routing).
- **Enrolling actioncontroller in the extra-surface gate** — RFC 0167 (gates).

## Alternatives considered

- **Receipt the config seats as a TS shape.** A static field is not a language
  shortcoming; `classAttribute()` / `cattrAccessor` exist and are credited.
- **One story per Rails test file.** 30+ files, many with one or two tests;
  grouped by module instead so each PR touches one lib area.

## Rollout

1. API — `action-controller-config-seats-onto-activesupport-primitives`,
   `abstract-controller-class-attributes-and-helper-resolution`,
   `restructure-http-authentication-into-basic-digest-and-token`,
   `metal-and-abstract-base-missing-methods`,
   `strong-parameters-missing-methods-and-invented-surface`,
   `conditional-get-and-etag-invented-helpers`,
   `metal-invented-registries-fold-into-rails-state`,
   `action-controller-barrel-and-header-helpers-extra-surface`
2. Tests — `port-render-test-expires-in-and-last-modified`,
   `port-render-test-etag-head-and-http-cache`, `port-api-controller-tests`,
   `port-respond-to-test-remainder-and-accept-format`,
   `port-filters-test-remainder`,
   `port-request-forgery-protection-skips-per-form-and-origin`,
   `port-request-forgery-protection-skips-token-storage`,
   `port-http-token-and-digest-authentication-tests`, `port-helper-test`,
   `port-params-wrapper-tests`,
   `port-new-base-bare-metal-base-and-middleware-tests`,
   `port-caching-test-skips`, `port-base-flash-and-log-subscriber-skips`,
   `port-redirect-send-file-and-metal-remainders`,
   `port-small-metal-test-files`
3. Close — `metal-base-call-baselines-to-zero`, `metal-parity-residue`

## Verification

- `pnpm parity:api --package actioncontroller` and `--package abstractcontroller`
  report every file this RFC owns at 100%, with no arity row.
- `pnpm parity:api:extra --package actioncontroller` lists no novel name in any
  file this RFC owns, and `action-dispatch/http-authentication.ts` no longer
  exists.
- No row remains in the eleven call baseline shards above.
- `pnpm parity:test --package actioncontroller` reports every file in the tests
  table complete.

## Open questions

None.

## Changelog

- 2026-09-27: initial RFC
- 2026-09-27: re-measured on trails `main` @ `2558bb83f4`: `metal/status-codes.ts` is gone; a new inheritance row (`MimeResponds::Collector < AbstractCollector`) folded into `metal-and-abstract-base-missing-methods`; recorded landed prior art; `append_*_action` rows re-scoped after `append-action-aliases-missing` put them on `base.ts`; `port-helper-test` no longer waits on the blocked did-you-mean story.
