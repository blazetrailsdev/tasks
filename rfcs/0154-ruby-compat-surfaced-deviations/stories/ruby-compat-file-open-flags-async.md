---
title: "ruby-compat: File::CREAT/EXCL/WRONLY and async File.open for Pidfile#write_file"
status: draft
updated: 2026-10-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Pidfile#write_file` (`vendor/solid_queue/v1.1.3/lib/solid_queue/supervisor/pidfile.rb:38-43`) is `::File.open(path, ::File::CREAT | ::File::EXCL | ::File::WRONLY) { |file| file.write(pid.to_s) }`. ruby-compat has no async `File.open` and no `File::CREAT` / `EXCL` / `WRONLY` constants, so `packages/solid-queue/src/supervisor/pidfile.ts` writes `File.writeAsync(path, pid, { mode: "wx" })`, and reads with `File.readAsync` where Rails has `::File.open(path).read`.

## Acceptance criteria

- ruby-compat ports the `File::Constants` open flags (`vendor/ruby/v3.3.11/file.c`) and an async block-form `File.open` accepting them.
- `Pidfile#writeFile` / `#checkStatus` call `File.open` as Rails does.
