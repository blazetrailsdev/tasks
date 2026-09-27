---
title: "Port the remaining string-URL button_to / link_to / to_form_params UrlHelperTest cases"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8182 ported the rest of `UrlHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/url_helper.rb`) into `packages/actionview/src/helpers/url-helper.ts`, which now scores 45/45 in `parity:api`. To stay under the PR LOC ceiling it ported only 28 of the 148 `UrlHelperTest` cases (`vendor/rails/v8.0.2/actionview/test/template/url_helper_test.rb`) into `packages/actionview/src/template/url-helper.test.ts`.

The following cases need no route helpers. They use string URLs, and the host view and `assertDomEqual` harness in that file already support them:

- `to_form_params` (`url_helper_test.rb:111-144`): `with_hash_having_symbol_and_string_keys`, `with_nested_hash`, `with_array_nested_in_hash`, `with_namespace`
- `button_to` (`:167-457`): `with_authenticity_token_true`, `with_authenticity_token_false`, `with_straight_url`, `with_false_url`, `with_form_class`, `with_form_class_escapes`, `with_query`, `with_value`, `with_html_safe_URL`, `with_query_and_no_name`, `with_javascript_confirm`, `with_javascript_disable_with`, `with_remote_and_javascript_confirm`, `with_remote_and_javascript_disable_with`, `with_remote_false`, `enabled_disabled`, `with_method_get`, `with_block`, `with_permitted_strong_params` / `with_unpermitted_strong_params` (Rails' `FakeParams`, `:414-430`), `with_nested_hash_params`, `with_nested_array_params`
- `link_to` (`:459-640`): `link_tag_with_straight_url`, `_with_query`, `_with_back_and_no_referer`, `_with_img`, `_with_custom_onclick`, `_with_javascript_confirm`, `link_to_with_remote`, `link_to_with_remote_false`, `link_tag_using_post_javascript`, `_using_delete_javascript`, `_using_delete_javascript_and_href`, `_using_post_javascript_and_confirm`, `_with_block`, `_escapes_content`, `_does_not_escape_html_safe_content`

## Acceptance criteria

- Each case above is ported under its verbatim Rails name, carrying ALL of its Rails assertions. The assertion ratchet counts assertions lexically, so a loop around one assertion counts once.
- `assert` / `assert_not` port as `toBeTruthy` / `toBeFalsy`.
- `parity:test`'s `url_helper_test.rb` matched count rises by the number of cases ported; the assertion ratchet stays green.
