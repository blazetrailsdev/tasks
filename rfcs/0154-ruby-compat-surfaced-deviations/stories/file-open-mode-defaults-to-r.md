---
title: 'ruby-compat File.open: mode defaults to "r" as rb_io_s_open does'
status: done
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 1
pr: trails#9177
claim: "2026-10-21T15:31:03Z"
assignee: "binary-string-bytesize-counts-bytes"
blocked-by: null
closed-reason: null
---

## Context

Ruby `File.open(path, mode = "r", ...)` (`vendor/ruby/v3.3.11/io.c` `rb_io_s_open` → `rb_open_file`; `mode` is optional and defaults to `"r"`) can be called as `File.open(path) { |f| ... }`. `ruby/spec library/yaml/shared/load.rb:11` does exactly that.

`packages/ruby-compat/src/file.ts:446-463` requires `mode`. A two-argument `File.open(path, block)` binds the block to `mode` and fails with `mode.indexOf is not a function`. trails#8934's `psych-load.test.ts` / `psych-unsafe-load.test.ts` work around this by passing `"r"` explicitly.

## Acceptance criteria

- [ ] `File.open`'s `mode` slot defaults to `"r"`, as Ruby's does. A caller that skips it passes `undefined` (CLAUDE.md, "An optional positional before trailing options or a block"). There is no `typeof` overload on the slot.
- [ ] The two psych load spec ports call `File.open(testFile, undefined, (yf) => ...)`, matching `load.rb:11`.
