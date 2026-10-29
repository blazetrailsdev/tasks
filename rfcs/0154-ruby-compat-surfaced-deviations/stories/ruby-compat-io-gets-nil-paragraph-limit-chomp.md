---
title: "ruby-compat: IO#gets/readline nil, paragraph, limit and chomp arms"
status: draft
updated: 2026-10-29
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

`IO#gets(sep)` / `IO#readline(sep)` in `packages/ruby-compat/src/io.ts` (added in trails#9451 for mini_mime's `readline("\n")`) handle only a String separator. `rb_io_gets_m` (`vendor/ruby/v3.3.11/io.c:4363`), through `prepare_getline_args` / `rb_io_getline_0`, also takes:

- `nil`: read the rest of the stream;
- `""`: paragraph mode, which splits on runs of `"\n\n"` and skips leading newlines;
- an Integer `limit` (`gets(limit)` / `gets(sep, limit)`);
- the `chomp:` keyword.

`StringIO#gets` (`packages/ruby-compat/src/string-io.ts:216`) takes no separator at all.

## Acceptance criteria

- `IO#gets` / `IO#readline` accept `sep: string | null`, an optional `limit`, and `{ chomp }`, with Ruby's semantics for `nil`, `""` (paragraph mode), the limit, and chomp.
- `StringIO#gets` takes the same arguments.
- Each arm has a trails test citing its `io.c` line.
