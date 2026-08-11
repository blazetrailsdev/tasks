---
title: "port-system-testing-driver-browser"
status: closed
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
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
closed-reason: "out of scope: targets actionpack; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

`ActionDispatch::SystemTesting::Driver#initialize`
(vendor/rails/actionpack/lib/action_dispatch/system_testing/driver.rb:10-25)
assigns `@driver_type`, `@screen_size`, `@options`, `@name`, `@capabilities`,
then for `:selenium` builds `@browser = Browser.new(options[:using])` and
`@browser.preload unless @options[:browser] == :remote`; otherwise
`@browser = nil`.

trails' constructor
(`packages/actionpack/src/action-dispatch/system-testing/driver.ts:47-55`)
assigns `_driverType`, `_using`, `_screenSize`, `_options`, `name` — no
`capabilities`, no `Browser` construction, no `preload`, no `@browser = nil`
arm. `Browser` has no trails counterpart at all, and the `:using` option is
stored raw instead.

Surfaced by `audit-constructor-idiom-cluster-reasons` (RFC 0084): the row was
carrying a "constructor idiom — the construction is present in the port" reason
that is false. Note that the same row also flags a missing `delete` (Rails'
`@options.delete(:name)`), which the port spells as a `delete opts.name`
operator rather than a call.

## Acceptance criteria

- `Browser` (`system_testing/browser.rb`) is ported, or this story is blocked
  with that as the specific blocker.
- The constructor carries Rails' branches in Rails' order, including the
  `capabilities` block parameter and the `else @browser = nil` arm.
- The `initialize` row is DELETED from
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/system-testing/driver.json`
  by hand (only-shrink, `serializeBaseline`).
