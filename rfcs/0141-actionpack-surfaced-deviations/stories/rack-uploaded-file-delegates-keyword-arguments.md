---
title: "rack-uploaded-file-delegates-keyword-arguments"
status: draft
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Rack::Multipart::UploadedFile "delegates keyword arguments to the tempfile"

## Context

`vendor/rack/v3.2.8/test/spec_multipart.rb:1063-1068` calls `file.readlines(chomp: true)` and
`file.gets(chomp: true)` on an `UploadedFile`, which forwards through `method_missing` to its
binary `Tempfile`. In trails, ruby-compat's `IO#gets` (`packages/ruby-compat/lib/io.ts`,
`gets(sep = "\n")`) takes no `chomp:` option, `IO#readlines` has no instance form (only the
static `IO.readlines`), and the tempfile is opened `Encoding.BINARY`, so a read answers a
`Uint8Array` where Ruby's ASCII-8BIT `"contents"` compares equal to the literal.

The rest of the rack 3.2 multipart specs were ported by the
`rack-3-2-port-remaining-multipart-specs` bundle PR.

## Acceptance criteria

- `IO#gets` accepts `chomp:` (`rb_io_gets_m`, `vendor/ruby/v3.3.11/io.c:4363`), and `IO#readlines` has
  its instance form (`rb_io_readlines`, `io.c`) with `chomp:`.
- "delegates keyword arguments to the tempfile" is ported in `packages/rack/test/multipart.test.ts`
  with its Rails name and both assertions.
