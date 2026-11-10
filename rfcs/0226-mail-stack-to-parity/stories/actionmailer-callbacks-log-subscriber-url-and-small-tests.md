---
title: "Port callbacks, log_subscriber, url, asset_host, form_builder and i18n_with_controller tests"
status: done
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "actionmailer"
deps: []
deps-rfc: []
est-loc: 500
priority: 3
pr: trails#9961
claim: "2026-11-10T16:24:49Z"
assignee: "actionmailer-callbacks-log-subscriber-url-and-small-tests"
blocked-by: null
closed-reason: null
---

## Context

No TS files for: `callbacks_test.rb` (6), `log_subscriber_test.rb` (3),
`url_test.rb` (2), `asset_host_test.rb` (2), `form_builder_test.rb` (1),
`i18n_with_controller_test.rb` (1), all under
`vendor/rails/v8.0.2/actionmailer/test/`. The two `delivery_methods_test.rb`
skips are owned by `stub-any-instance-does-not-intercept-js-new` and are not in
scope here.

## Acceptance criteria

- [ ] Each file is ported at its convention path with every test by name.
