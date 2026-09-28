---
title: "Port the UrlHelperTest cases that need include routes.url_helpers and the Workshop/Session models"
status: in-progress
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: ["url-for-included-hook-includes-url-for-modules"]
deps-rfc: []
est-loc: 500
priority: null
pr: trails#8230
claim: "2026-09-28T20:41:37Z"
assignee: "assign-controller-stores-default-form-builder-method-uncalled"
blocked-by: null
closed-reason: null
---

## Context

`UrlHelperTest` (`vendor/rails/v8.0.2/actionview/test/template/url_helper_test.rb:23-64`) draws a `RouteSet`, does `include routes.url_helpers`, and defines the `Workshop` (`:5-21`) and `Session` models. 36 of its cases depend on that setup and are still unported in `packages/actionview/src/template/url-helper.test.ts` after trails#8182:

- `url_for` (`:65-109`): `does_not_escape_urls`, `does_not_include_empty_hashes`, `with_array_defaults_to_only_path_true`, `with_array_and_only_path_set_to_false`
- `button_to` with routes or models (`:193-268`, `:386`): `with_path`, `with_new_record_model`, `with_new_record_model_and_block`, `with_nested_new_record_model_and_block`, `with_persisted_model`, `with_persisted_model_and_block`, `with_nested_persisted_model_and_block`, `with_block_and_hash_url`
- `link_to` (`:463-652`): `link_tag_without_host_option`, `_with_host_option`, `link_with_nil_html_options`, `link_to_with_symbolic_remote_in_non_html_options`, `_with_string_remote_in_non_html_options`, `link_tag_using_block_and_hash`, `_using_block_in_erb` (the `render_erb` harness, as `render_tse`), `_with_html_safe_string`, `_using_active_record_model`, `_using_active_record_model_twice`
- `link_to_if` / `link_to_unless` (`:654-685`, `:784-830`): `link_to_unless`, `link_to_if`, `link_to_if_with_block`, `link_unless_current`, `link_to_unless_with_block`
- `current_page?` (`:691-762`): `with_http_head_method`, `with_simple_url`, `ignoring_params`, `considering_params`, `when_options_given_as_keyword_arguments`, `with_params_that_match`, `with_escaped_params`, `with_escaped_params_with_different_encoding`, `with_double_escaped_params`

`test_current_page_considering_params` also exercises the `options.delete(:check_parameters)` arm, which is `hashDelete(options, "checkParameters")` in `isCurrentPage`.

## Acceptance criteria

- The host includes `routes.urlHelpers()` the way Rails includes `routes.url_helpers`. This depends on `url-for-included-hook-includes-url-for-modules`, so a view class answers `urlFor(hash)` through `RoutingUrlFor`.
- `Workshop` / `Session` mirror Rails' `ActiveModel::Naming` + `Conversion` test models.
- Each case above is ported under its verbatim Rails name with all of its Rails assertions.
