---
title: "BasicSocket#waitReadable takes IO#wait_readable's timeout and answers nil when it passes"
status: draft
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: fidelity
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#9384, which gave `BasicSocket#waitWritable` Ruby's `timeout`. `BasicSocket#waitReadable` (`packages/ruby-compat/src/socket.ts`) still takes no argument and can only wait forever. Ruby's `IO#wait_readable(timeout = nil)` (`vendor/ruby/v3.3.11/io.c:9742` `io_wait_readable`) returns truthy immediately when buffered data is pending, otherwise waits up to `timeout` seconds and returns `nil` when it expires (`io_wait_event`, `io.c:9710-9716`). A negative timeout raises `ArgumentError: time interval must not be negative` (`rb_time_interval`, `io.c:1445-1446`, `time.c:2852`). A closed read side raises `IOError` first (`rb_io_check_char_readable`).

## Converged shape

`waitReadable(timeout: number | null = null): Promise<this | null>`, in the same shape as `waitWritable`: `IOError`, then `ArgumentError` for a negative timeout, both before any wait; then the timer, and `IOError` if the socket is closed during the wait. Add `.trails.test.ts` cases for the timeout returning `nil`, a negative timeout, and close-during-wait.
