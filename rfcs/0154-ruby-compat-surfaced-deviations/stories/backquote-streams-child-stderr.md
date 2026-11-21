---
title: "rbFBackquote streams the child's stderr to $stderr as MRI's inherited fd 2 does"
status: draft
updated: 2026-11-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbFBackquote` (`packages/ruby-compat/lib/kernel-system.ts`) runs the child
through the adapter's `capture3`, which resolves after exit, then writes the
child's stderr to `STDERR` in one piece (trails#10463). MRI's `rb_f_backquote`
pipes only stdout and leaves fd 2 inherited (`pipe_open`,
`vendor/ruby/v3.3.11/io.c:7513`), so the child's stderr reaches `$stderr` as
it is written, interleaved with whatever the parent prints meanwhile.

## Acceptance criteria

- `rbFBackquote` forwards the child's stderr to the current `STDERR` as chunks
  arrive (a streaming spawn on the child-process adapter), not after exit.
- `packages/ruby-compat/test/kernel-backquote.trails.test.ts` pins a chunk
  written before the child exits reaching `STDERR` before the promise settles.
