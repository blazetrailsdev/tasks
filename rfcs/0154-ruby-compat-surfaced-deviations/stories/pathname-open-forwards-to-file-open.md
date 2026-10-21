---
title: "pathname-open-forwards-to-file-open"
status: done
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9177
claim: "2026-10-21T15:31:03Z"
assignee: "binary-string-bytesize-counts-bytes"
blocked-by: null
closed-reason: null
---

## Context

`Pathname#open` (`vendor/ruby/v3.3.11/ext/pathname/pathname.c`, `path_open`) is
`File.open(self.to_path, *args, &block)`. ruby-compat's `Pathname`
(`packages/ruby-compat/src/pathname.ts`) has no `open`.

marcel's `MimeType.with_io` (`marcel/mime_type.rb`, marcel 1.0.4) calls
`pathname_or_io.open(&block)` for every `Pathname`. The Ruby-to-TS generator's
marcel trial (branch `codegen-native-inference`) fails 209 of 374 marcel tests
on `pathnameOrIo.open is not a function`. With `open` added, they pass.

## Acceptance criteria

- `Pathname#open(...args, block?)` forwards to `File.open(this.toPath(), ...args, block)`.
  With no mode it opens `"r"`, as Ruby's does.
- It answers the block's value when a block is given, and the `File` otherwise.
- A test opens a fixture through `new Pathname(path).open(block)` and reads its
  bytes. It fails before the change.
