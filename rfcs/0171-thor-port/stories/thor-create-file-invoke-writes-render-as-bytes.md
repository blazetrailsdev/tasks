---
title: 'CreateFile#invoke! writes render''s bytes (binary "wb" open), not a UTF-8 re-encode'
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Actions::CreateFile#invoke!` writes `File.open(destination, "wb", config[:perm]) { |f| f.write render }`
(`vendor/thor/v1.3.2/lib/thor/actions/create_file.rb:64`): binary mode, so the String's bytes reach
the file unchanged. The port (`packages/trailties/src/thor/actions/create-file.ts`, `invokeBang`)
calls `File.writeAsync(this.destination, await this.render(), { perm })` with a JS string, which the
fs backend encodes as UTF-8. ruby-compat carries a byte that is not valid UTF-8 as a lone surrogate
(`packages/ruby-compat/src/string/bytes.ts`, `bytes` / `strNew`), and a UTF-8 encoder writes that
surrogate as U+FFFD, so such content is corrupted on write.

`identical?` in the same file (`create_file.rb:47`) already compares against
`Uint8Array.from(bytes(...))`, so a file written this way never reads back as identical.

trails#8521 widened `File.writeAsync` to take a `Uint8Array` (a String held as its bytes), and
`gsub_file` (`packages/trailties/src/thor/actions/file-manipulation.ts`) writes
`Uint8Array.from(bytes(content))` for the same `"wb"` open.

## Acceptance criteria

- [ ] `CreateFile#invokeBang` writes `Uint8Array.from(bytes(await this.render()))` through
      `File.writeAsync`, keeping `perm`.
- [ ] A `.trails.test.ts` case creates a file whose content carries a non-UTF-8 byte and asserts the
      bytes on disk, and that a second `createFile` with the same content reports `identical`.
