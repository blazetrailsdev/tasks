---
title: "Converge rake --job-stats and terminal width stdin"
status: in-progress
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9520
claim: "2026-10-31T02:00:27Z"
assignee: "compare-file-async-reads-without-sync-fs"
blocked-by: null
closed-reason: null
---

## Context

`Application#runWithThreads` (`packages/rake/src/application.ts`) is `yield` only, so `--job-stats` still parses (`options.jobStats`) but prints nothing, where `vendor/rake/v13.2.1/lib/rake/application.rb:150-156` prints "Maximum active threads" / "Total threads in play" and shows the history. Separately, `dynamicWidthStty` / `dynamicWidthTput` use `</dev/tty` because `ChildProcessAdapter.spawnSync` cannot inherit stdin, where `application.rb:384,388` backticks inherit it; and `Backtrace`'s `node:` / `<anonymous>` tokens have no receipt beyond `backtrace.rb:16`.

## Acceptance criteria

- [ ] `--job-stats` either reports equivalent figures from `invokePrerequisitesConcurrently` or the option's dead arm is settled by the repo owner.
- [ ] `spawnSync` can inherit stdin and the width helpers run Rails' exact commands.
- [ ] The backtrace tokens carry a receipt.
