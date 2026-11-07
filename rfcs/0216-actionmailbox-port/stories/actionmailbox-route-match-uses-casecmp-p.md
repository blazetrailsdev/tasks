---
title: "Route#isMatch String arm uses a ported String#casecmp?"
status: done
updated: 2026-11-07
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9841
claim: "2026-11-07T17:17:13Z"
assignee: "app-generator-adds-master-key-and-credentials"
blocked-by: null
closed-reason: null
---

## Context

`Route#isMatch`'s String arm (`packages/actionmailbox/src/router/route.ts`) compares `address.toLowerCase() === recipient.toLowerCase()`. Rails is `address.casecmp?(recipient)` (`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/router/route.rb:17`), which uses Unicode case folding (`rb_str_casecmp_p`, `vendor/ruby/v3.3.11/string.c`). ruby-compat exports `casecmp` (ASCII-only) but no `casecmp?`.

## Acceptance criteria

- ruby-compat ports `String#casecmp?` (fold both sides, `nil` for a non-String) citing MRI.
- `Route#isMatch` calls it in place of the `toLowerCase` comparison.
- A ruby-compat test covers a fold toLowerCase misses (e.g. `"ß".casecmp?("SS")` is false, `"ǅ".casecmp?("ǆ")` true), checked against `ruby -e`.
