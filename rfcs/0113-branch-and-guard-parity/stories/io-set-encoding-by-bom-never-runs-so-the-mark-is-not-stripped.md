---
title: "FMODE_SETENC_BY_BOM is set but io_set_encoding_by_bom never runs"
status: draft
updated: 2026-09-08
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR 7612 (`io-modestr-fmode-drops-the-bom-encoding-prefix`) ported the mode-string
half of MRI's BOM handling: `rbIoModestrFmode` now runs the `':'` arm with
`io_encname_bom_p` (`vendor/ruby/io.c:6480-6483`) and the `fmode` threads into
`parseModeEnc` (`io.c:6671-6681`) and `rbIoExtIntToEncs` (`io.c:6639`), so
`File.open(path, "r:bom|utf-8")` opens and `"r:bom|euc-jp"` warns.

Nothing consumes the flag. MRI's `rb_file_open_generic` ends with
`if (fmode & FMODE_SETENC_BY_BOM) io_set_encoding_by_bom(io);`
(`vendor/ruby/io.c:7196`, and again at `io.c:9526`), and
`io_set_encoding_by_bom` (`io.c:7148-7163`) calls `io_strip_bom`
(`io.c:7085-7145`) — which reads the leading bytes, returns the encoding index
the mark names and leaves the stream positioned past it, or ungets every byte
it read and returns 0. On a hit the stream's encodings are re-set from the
detected encoding; on a miss `fptr->encs.enc2 = NULL` (`io.c:7161`).

Two consequences in trails today:

- The mark is not stripped, so a UTF-8 file opened `"r:bom|utf-8"` reads back
  with a leading `U+FEFF` where MRI's read has none.
- The miss path does not clear `enc2`, so `File.open(path, "r:bom|utf-8:euc-jp")`
  on a file with no BOM answers `external_encoding` UTF-8 where MRI answers
  EUC-JP. Verified against MRI 3.3.11:
  `ruby -e 'File.write("x","hi"); p File.open("x","r:bom|utf-8:euc-jp").external_encoding'`
  answers `#<Encoding:EUC-JP>`.

The sibling story `io-read-cannot-bom-sniff-the-utf-16-and-utf-32-dummy-seats`
(#7614) landed BOM sniffing for the UTF-16/UTF-32 dummy seats but did not add
`io_strip_bom` or `io_set_encoding_by_bom`; neither name is in
`packages/ruby-compat/src/io.ts` on main.

## Converged shape

Port `io_strip_bom` (`io.c:7085`) and `io_set_encoding_by_bom` (`io.c:7148`)
onto `IO`, and call the latter at the end of the open path where MRI does —
`rb_file_open_generic`'s `if (fmode & FMODE_SETENC_BY_BOM)` (`io.c:7196`), which
in trails is `File.open` after it has set the encodings. `io_strip_bom` needs a
byte-level read with unget; MRI builds it out of `rb_io_getbyte` /
`rb_io_ungetbyte`, so port whichever of those the trails stream still lacks
rather than inventing a peek helper.

`IO#set_encoding_by_bom` (`rb_io_set_encoding_by_bom`, `io.c:9555`, registered
at `io.c:15552`) is the public member over the same body; port it only if this
story's own call site needs it.

## Acceptance criteria

- [ ] `io_strip_bom` and `io_set_encoding_by_bom` are ported at their Rails
      names, and the open path calls the latter under
      `fmode & FMODE_SETENC_BY_BOM` as `io.c:7196` does.
- [ ] A UTF-8 file with a leading BOM opened `"r:bom|utf-8"` reads back without
      the `U+FEFF`.
- [ ] `File.open(path, "r:bom|utf-8:euc-jp")` on a BOM-less file answers
      `EUC-JP` from `externalEncoding()` and `null` from `internalEncoding()`,
      as MRI does.
- [ ] `io.trails.test.ts` and `file.trails.test.ts` keep their names and pass.
