---
title: "rake-exe-and-functional-tests"
status: done
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9522
claim: "2026-10-31T02:36:40Z"
assignee: "rake-exe-and-functional-tests"
blocked-by: null
closed-reason: null
---

## Context

`rake-application-top-level-run` ported `Application#run` and `top_level` but stayed under the 800 LOC ceiling by leaving out everything needing a real CLI subprocess. Unported: `vendor/rake/v13.2.1/test/test_rake_functional.rb` (529 lines), its fixtures `test/support/rakefile_definitions.rb` (517 lines, to become `Rakefile.ts` fixtures), the subprocess class `TestRakeBacktrace` (`test/test_rake_backtrace.rb:46-126`), and the runner `test/support/ruby_runner.rb`. packages/rake has no `exe/rake` entry (`packages/rake/package.json` has no `bin`), so these need one first. `test_trace_issues_single_io_for_args_multiple_strings_and_alternate_sep` (`test/test_trace_output.rb:43`) is also unported: ruby-compat has no `$\`.

## Acceptance criteria

- [ ] packages/rake ships a `rake` executable calling `Rake.application.run`, as `exe/rake` does.
- [ ] `test_rake_functional.rb` and `TestRakeBacktrace` port as native Vitest over a subprocess, names matching for `parity:test`.
- [ ] `Backtrace.collapse` is verified against real frames from a `Rakefile.ts` (`test_single_collapse`, `test_multi_collapse`, `test_suppress_option`).
- [ ] The `$\` test is ported or parked with a `PERMANENT-SKIP:` line.
