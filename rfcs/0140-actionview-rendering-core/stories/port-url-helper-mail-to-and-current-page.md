---
title: "port-url-helper-mail-to-and-current-page"
status: ready
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
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
`port-url-helper-and-include-routing-url-for`).

Still unported, and independent of the `link_to` / `button_to` half:

- `mail_to` (`url_helper.rb:487-501`), `sms_to` (`:618-632`), `phone_to`
  (`:669-680`)
- `current_page?` (`:548-576`) and its `remove_trailing_slash!` (`:806`)
- `BUTTON_TAG_METHOD_VERBS` (`:23`) is already ported

## Acceptance criteria

- Each method above exists in `url-helper.ts` at its Rails name, as `isCurrentPage`
  for the predicate, with its Rails control flow.
- The `test_mail_to*`, `test_sms_to*`, `test_phone_to*` and `test_current_page*`
  cases in `actionview/test/template/url_helper_test.rb` are ported to
  `packages/actionview/src/template/url-helper.test.ts` under their Rails names.
