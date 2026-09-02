---
title: "multipart-generator-body-must-be-a-binary-string"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 23
pr: 7401
claim: "2026-09-02T18:45:08Z"
assignee: "converge-env-for-symbol-opts-onto-colon-spelling"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Multipart::Generator#dump` (`vendor/rack/lib/rack/multipart/generator.rb`)
builds its body out of the tempfile contents `Rack::Multipart::UploadedFile`
holds, and `UploadedFile#initialize`
(`vendor/rack/lib/rack/multipart/uploaded_file.rb`) opens that tempfile in
BINARY: the resulting String is `ASCII-8BIT`, one character per byte, so
`data.length` in `MockRequest.env_for` (`vendor/rack/lib/rack/mock_request.rb:131`)
and `Rack::Lint`'s `CONTENT_LENGTH` checks agree with the byte count a server
would see.

trails' `UploadedFile` reads the file with
`getFs().readFileSync(path, binary ? "latin1" : "utf-8")`
(`packages/rack/src/multipart/uploaded-file.ts:62`). Only the `binary: true`
arm produces the one-char-per-byte string Ruby always produces; the default
`utf-8` arm decodes multi-byte sequences into single JS characters. A generated
body carrying non-ASCII file content, field values or filenames therefore has a
`.length` (UTF-16 code units) below its UTF-8 byte length.

That contract is written down and relied on elsewhere:
`packages/ruby-compat/src/string-io.ts:7-11` states the buffer is a Ruby binary
String so `size`, `read`'s length and `write`'s return value count bytes
exactly as Ruby's do. `MockRequest.envFor` sets
`opts["CONTENT_LENGTH"] ??= String(data.length)` and, two lines later,
`env["CONTENT_LENGTH"] ??= String(env[RACK_INPUT].size)` — both are correct
_given_ the contract and both undercount together when it is broken, so the fix
belongs in the generator/UploadedFile pair, not at either length site.

Surfaced in review of #7363.

## Acceptance criteria

- `UploadedFile` produces a one-char-per-byte string for its tempfile contents
  regardless of the `binary` flag, matching Ruby's unconditional binary open,
  or the divergence is converged some other way that restores the
  `string-io.ts:7-11` contract for generator output.
- A `Generator#dump` body built from non-ASCII content has a `.length` equal to
  its UTF-8 byte length, so `MockRequest.envFor`'s `CONTENT_LENGTH` matches what
  a server would read.
- Covered by a test that fails on the current tree.
