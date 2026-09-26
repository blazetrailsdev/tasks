---
title: "ruby-compat stdout is a write-only WriteStream, not Ruby's $stdout IO"
status: in-progress
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8118
claim: "2026-09-25T23:17:02Z"
assignee: "datetime-civil-sub-minute-offset-loses-instant-on-cast"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `$stdout` / `STDOUT` is an `IO` (`vendor/ruby/io.c` `rb_stdout = rb_io_prep_stdout()`, `prep_stdio`), so anything taking a stream can default to it and call `puts` / `print` / `write` on it.

trails' `stdout` (`packages/ruby-compat/src/process-adapter.ts:52`) is a `WriteStream` with `write` only — no `puts`/`print` (`io.ts:27,83`) — and `IO`'s constructor is protected (`io.ts:520`). So a port like `ActiveRecord::SchemaDumper.dump(pool, stream = $stdout, ...)` (`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:44`) cannot default to stdout; `schema-dumper-dump-defaults-stream-to-stdout` is blocked on this.

## Converged shape

Export a ruby-compat `$stdout` IO-shaped seat (Ruby `STDOUT`) answering `write`/`puts`/`print` over the process adapter's stdout, reusing `io.ts`'s `puts`/`print` generic-writable functions.

## Acceptance criteria

- [ ] A ruby-compat stdout value accepted where `IO | StringIO` is, with `puts`/`print`/`write`.
- [ ] `schema-dumper-dump-defaults-stream-to-stdout` is unblocked.
