---
title: "Port the remaining mail_to / sms_to / phone_to / current_page? UrlHelperTest cases"
status: in-progress
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8239
claim: "2026-09-28T23:39:40Z"
assignee: "port-url-helper-mail-sms-phone-current-page-tests"
blocked-by: null
closed-reason: null
---

## Context

trails#8182 ported `mail_to`, `sms_to`, `phone_to` and `current_page?` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/url_helper.rb:487-680`) into `packages/actionview/src/helpers/url-helper.ts`. It ported only a few of their tests, to stay under the PR LOC ceiling.

The following `UrlHelperTest` cases (`vendor/rails/v8.0.2/actionview/test/template/url_helper_test.rb`) need no route helpers. The `requestForUrl` request double in `packages/actionview/src/template/url-helper.test.ts` covers the `current_page?` ones:

- `current_page?` (`:719-776`): `considering_params_when_options_does_not_respond_to_to_hash`, `with_scope_that_match`, `with_trailing_slash`
- `mail_to` (`:832-898`): `mail_to`, `with_img`, `with_html_safe_string`, `with_nil`, `returns_html_safe_string`, `with_block`
- `sms_to` (`:906-970`): `sms_to`, `with_img`, `with_html_safe_string`, `with_nil`, `returns_html_safe_string`, `with_block`, `with_block_and_options`, `does_not_modify_html_options_hash`
- `phone_to` (`:973-1039`): `phone_to`, `with_img`, `with_html_safe_string`, `with_nil`, `returns_html_safe_string`, `with_block`, `with_block_and_options`, `does_not_modify_html_options_hash`

## Acceptance criteria

- Each case is ported under its verbatim Rails name with all of its Rails assertions.
- `assert_predicate x, :html_safe?` ports as an `isHtmlSafe` check, not as `toBeInstanceOf(SafeBuffer)`.
- `parity:test`'s `url_helper_test.rb` matched count rises accordingly; the assertion ratchet stays green.
