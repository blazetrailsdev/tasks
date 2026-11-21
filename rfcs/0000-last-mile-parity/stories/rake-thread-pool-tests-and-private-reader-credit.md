---
title: "rake: port the four thread-pool tests and credit private_reader"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
cluster: small-packages
packages: [rake]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four `test_thread_pool.rb` tests are parked as "a future runs on the event
loop; there is no Thread.current". `packages/rake/lib/thread-pool.ts:86` runs
each future on a ruby-compat `Thread`, and `Thread.current()`
(`packages/ruby-compat/lib/thread.ts:165`) is AsyncLocalStorage-backed. The API
miss is `private_reader` (`vendor/rake/.../lib/rake/private_reader.rb`).
"private reader is private" stays PERMANENT (visibility). "default arguments
that dont match names are ignored" (`test_rake_task_arguments.rb:112-116`) is
PERMANENT, but its receipt is cut off mid-sentence.

## Acceptance criteria

- [ ] The four thread-pool tests run as the Rails bodies and pass.
- [ ] `private_reader` is credited on `parity:api` at its Rails file.
- [ ] The task-arguments receipt cites CLAUDE.md "A Ruby Symbol is a JS string".
- [ ] rake shows only PERMANENT skips.
