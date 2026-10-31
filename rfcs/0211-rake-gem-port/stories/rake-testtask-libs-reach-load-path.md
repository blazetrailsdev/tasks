---
title: "TestTask libs reach the test process load path"
status: done
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9540
claim: "2026-10-31T16:55:20Z"
assignee: "rake-testtask-and-loader-unit-tests"
blocked-by: null
closed-reason: null
---

## Context

`Rake::TestTask#ruby_opts_string` (`vendor/rake/v13.2.1/lib/rake/testtask.rb:152-157`) prepends `-w` and `-I"#{lib_path}"`. `FileUtils::RUBY` is `node`, which rejects both, so `packages/rake/src/testtask.ts` `rubyOptsString` emits `--pending-deprecation` and drops `-I`, leaving `libPath` with no caller (trails#9534, `packages/rake/CLAUDE.md` § "TestTask runs `node`"). No owner ruling exists. A killed test also goes through `/bin/sh`, reporting status 143, so the `SignalException` arm (`testtask.rb:110-111`) was not seen to run.

## Acceptance criteria

- [ ] `libs` reaches the test process's `LOAD_PATH`, with `lib_path` called, for example by the loader reading it, or the owner rules the drop PERMANENT.
- [ ] A test exercises the `status.signaled?` arm raising `SignalException`.
