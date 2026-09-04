---
title: "Port IO#set_encoding onto StringIO and Tempfile — a missing member here silently drops the multipart file body"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7474
claim: "2026-09-04T12:11:20Z"
assignee: "port-set-encoding-on-stringio-and-tempfile"
blocked-by: null
closed-reason: null
---

## Context

`IO#set_encoding` has no port on any of trails' IO-ish seats.
`Encoding::BINARY` exists (`packages/ruby-compat/src/encoding.ts:146`) and
`Encoding.find` was seated in #7450, but neither
`packages/ruby-compat/src/string-io.ts`, `packages/ruby-compat/src/io.ts`, nor
`packages/activesupport/src/tempfile.ts` answers `setEncoding`.

Surfaced by RFC 0137-rack-test-gem-port, where it appears twice and on two
different receivers:

- `@tempfile.set_encoding(Encoding::BINARY)`
  (`vendor/rack-test/lib/rack/test/uploaded_file.rb:93`) — on a `Tempfile`,
  right before `FileUtils.copy_file` writes the bytes in.
- `uploaded_file.set_encoding(Encoding::BINARY)`
  (`vendor/rack-test/lib/rack/test/utils.rb:148`), guarded by
  `if uploaded_file.respond_to?(:set_encoding)` (`:147`) — so the port also has
  to make `respondTo` answer truthfully, which is a second reason a missing
  member is not silently harmless here: the guard would just take the other
  branch and skip `append_to`, dropping the file body from the multipart
  buffer entirely.

Sequencing note: `Tempfile` is still `packages/activesupport/src/tempfile.ts`
because `0129-ruby-compat/move-tempfile-to-ruby-compat` is **blocked** on the
platform-adapter seat (`tempfile.ts:86` calls `getCrypto()`, so it cannot move
into a leaf package), which RFC 0135's `move-crypto-adapter-into-ruby-compat`
unblocks. This story does **not** wait on that and does not re-home anything —
it adds the member where each class lives today.

Also related, and not this story:
`0135-platform-adapters-in-ruby-compat/rack-uploaded-file-tempfile-is-an-in-memory-stand-in`.
rack-test's `UploadedFile#path` (`uploaded_file.rb:45`) and its
`FileUtils.copy_file(path, @tempfile.path)` (`:95`) both need a real path, so
that story is a genuine dependency of `port-rack-test-uploaded-file` — but it
is about the tempfile's backing, not its encoding.

## Acceptance criteria

- [ ] `setEncoding` on `StringIO` (`packages/ruby-compat/src/string-io.ts`) and
      on `Tempfile` (`packages/activesupport/src/tempfile.ts` — wherever it
      lives when this is claimed), anchored to MRI's `IO#set_encoding` /
      `StringIO#set_encoding`, taking an `Encoding` or its name (both arms —
      Ruby accepts a String).
- [ ] `respondTo("setEncoding")` answers true on those receivers, so
      `utils.rb:147`'s guard ports as the same branch Ruby takes.
- [ ] A test pins that bytes written after `setEncoding(Encoding.BINARY)` read
      back unmodified — the reason rack-test makes the call at all.
- [ ] No re-homing of `Tempfile`; that is
      `move-tempfile-to-ruby-compat` and it is blocked.
