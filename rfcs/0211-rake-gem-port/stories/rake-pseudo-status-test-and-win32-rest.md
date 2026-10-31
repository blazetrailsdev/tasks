---
title: "rake-pseudo-status-test-and-win32-rest"
status: ready
updated: 2026-10-31
rfc: "0211-rake-gem-port"
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

Held out of trails#9511 for the 800 LOC ceiling: `vendor/rake/v13.2.1/test/test_rake_pseudo_status.rb` (`packages/rake/src/pseudo-status.ts` is ported), and the rest of `lib/rake/win32.rb:11-50` (`Win32HomeError`, `win32_system_dir`, `normalize`) with `standard_system_dir`'s Windows arm (`application.rb:768-772`); `packages/rake/src/win32.ts` has only `windows?`.

## Acceptance criteria

- [ ] `test_rake_pseudo_status.rb` ports as `packages/rake/src/test-rake-pseudo-status.test.ts`.
- [ ] `win32.rb` is fully ported and `standardSystemDir` takes the Windows arm.
