---
title: "port-url-helper-link-to-and-button-to"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
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

`packages/actionview/src/helpers/url-helper.ts` ports only the `url_for` /
`_back_url` / `_filtered_referrer` / `ClassMethods` slice of
`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/url_helper.rb` (see
`port-url-helper-and-include-routing-url-for`). `pnpm parity:api --package actionview`
now measures the file: `helpers/url_helper.rb` is at 19/45.

Still unported, the link and button half:

- `link_to` (`url_helper.rb:198-208`), `link_to_unless_current` (`:390`),
  `link_to_unless` (`:414`), `link_to_if` (`:437-447`)
- `button_to` (`:296-350`) and `mattr_accessor :button_to_generates_button_tag`
  (`:35`)
- the private helpers they call: `convert_options_to_data_attributes` (`:683`),
  `url_target` (`:698`), `link_to_remote_options?` (`:706`),
  `add_method_to_attributes!` (`:712`), `method_for_options` (`:723`),
  `method_not_get_method?` (`:741`), `token_tag` (`:746`), `method_tag` (`:760`),
  `to_form_params` (`:780`)

`url_helper.rb` also `include TagHelper` and `include ContentExfiltrationPreventionHelper`
(`:26-27`); the latter is unported.

## Acceptance criteria

- Each method above exists in `url-helper.ts` at its Rails name, and Rails'
  control flow mirrors it.
- The matching `UrlHelperTest` cases in `actionview/test/template/url_helper_test.rb`
  (`test_link_tag_*`, `test_button_to_*`, `test_link_to_if*`,
  `test_link_to_unless*`) are ported to
  `packages/actionview/src/template/url-helper.test.ts` under their Rails names.
- `helpers/url_helper.rb`'s matched count rises in `pnpm parity:api --package actionview`.
