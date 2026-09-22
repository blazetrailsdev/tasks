---
title: "quote-error-message-uses-js-constructor-name"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Converging quoting_test.rb `test_quote_duration` (vendor/rails/activerecord/test/cases/quoting_test.rb:197-200) asserts `e.message == "can't quote ActiveSupport::Duration"`. Rails raises at abstract/quoting.rb:87 with `value.class.name`, the Ruby constant path. trails' `quote` (packages/activerecord/src/connection-adapters/abstract/quoting.ts:100) uses `value.constructor?.name`, yielding "can't quote Duration". Same shape for any namespaced class (`Object` matches only by coincidence). Parked as it.skip in packages/activerecord/src/quoting.test.ts. Cause of missing mapping not investigated beyond this line.

## Acceptance criteria

- The message names the Ruby class path (e.g. ActiveSupport::Duration) via whatever settled class-path idiom exists, and the parked test is un-skipped and green.
