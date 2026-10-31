---
title: "Port Application display_exception_backtrace, rakefile_location and windows?"
status: done
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9511
claim: "2026-10-30T22:14:50Z"
assignee: "rake-application-backtrace-and-rakefile-location"
blocked-by: null
closed-reason: null
---

## Context

trails#9503 ported the first half of `vendor/rake/v13.2.1/lib/rake/application.rb`. Left unported and not named by `rake-application-top-level-run`: `rakefile_location` (`application.rb:828-835`), `windows?` (`:396-398`), `display_exception_backtrace` (`:275-281`, called from `display_exception_details` at `:246`, which `packages/rake/src/application.ts` omits with no gate flagging it), and `test_windows` (`test/test_rake_application.rb:384-386`).

## Acceptance criteria

- [ ] `displayExceptionDetails` calls `displayExceptionBacktrace` as `application.rb:246` does, over `Backtrace.collapse`.
- [ ] `rakefileLocation` and `isWindows` are ported at their Rails names; `test_windows` is ported.
