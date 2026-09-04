---
title: "uploaded-file-read-drops-rails-length-and-buffer-arguments"
status: ready
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 21
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::UploadedFile#read` is
`@tempfile.read(length, buffer)` — a two-argument delegation
(`vendor/rails/actionpack/lib/action_dispatch/http/upload.rb:62-64`). trails'
`packages/actionpack/src/action-dispatch/http/upload.ts` declares
`read(): Buffer` with no parameters and always answers the WHOLE file, so its
delegation passes no arguments.

Surfaced by `flip-file-dir-call-sites-actionpack-and-actionview`, which
repointed the body onto `File.open(path, "rb", (file) => file.read())` — the
first spelling under which `parity:api:calls:args` can see the call at all
(`readFileSync` matched no Ruby name). The flip left a
`@missingRailsArgs read — CONVERGEABLE <this story>` receipt at the call site
rather than a baseline row.

The same gap is upstream of `#read`: trails' `UploadedFile` holds a path
string rather than a `Tempfile`, so there is no read position for a partial
read to advance, and `rewind` (`upload.ts`) is a documented no-op.

## Acceptance criteria

- `UploadedFile#read` takes Rails' `(length, buffer)` parameters and forwards
  them, honouring Ruby's semantics: `nil` length reads the rest of the stream,
  a positive length answers `null` at EOF, and `buffer` receives the bytes.
- `rewind` resets the read position rather than being a no-op, so a partial
  read followed by `rewind` re-reads from byte 0.
- The `@missingRailsArgs read` receipt at the call site is deleted, and
  `pnpm parity:api:calls:args` stays green with no new baseline row.
