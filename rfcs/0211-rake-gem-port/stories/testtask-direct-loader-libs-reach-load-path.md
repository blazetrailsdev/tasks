---
title: "TestTask :direct loader puts libs on LOAD_PATH"
status: done
updated: 2026-11-01
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9560
claim: "2026-11-01T01:54:44Z"
assignee: "testtask-direct-loader-libs-reach-load-path"
blocked-by: null
closed-reason: null
---

## Context

`Rake::TestTask#ruby_opts_string` (`vendor/rake/v13.2.1/lib/rake/testtask.rb:152-157`) gives every loader `-I"#{lib_path}"`. Since trails#9540, `packages/rake/src/testtask.ts` `runCode` passes `-I` only behind the `:rake` loader, which `rake-test-loader.ts` reads. The `:direct` arm's `-e` program (`testtask.rb:172-173`) runs no trails code, so `libs` never reaches its `LOAD_PATH`, and `:testrb` has no Node counterpart.

## Acceptance criteria

- [ ] `:direct` puts `libs` on the test process's `LOAD_PATH` ahead of existing entries, before any test file loads.
- [ ] `packages/rake/CLAUDE.md` § "TestTask runs `node`" is updated to match.
