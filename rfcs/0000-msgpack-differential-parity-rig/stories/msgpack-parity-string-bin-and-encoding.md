---
title: "msgpack parity: the str and bin families, encodings and invalid UTF-8"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: native
packages: ["msgpack"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The gem routes a Ruby String to the `str` family or the `bin` family by its
encoding: a UTF-8 String is `str`, an ASCII-8BIT String is `bin`. trails has
`writeString` (`packer.ts:170`) and `writeBin` (`:178`) as separate members,
and a JS string carries no encoding tag at all — the limit root CLAUDE.md
ratifies in "A String has no encoding tag either".

So this story is partly a parity test and partly a mapping question: the
value-spec's `enc` field is what stands in for the missing tag, and the rig
pins how each `enc` value must pack.

Invalid UTF-8 is the sharp edge. A JS string is UTF-16, so a lone surrogate
cannot represent an arbitrary byte sequence — `marshal.ts:1452` records
`TextEncoder` writing U+FFFD where Ruby writes the bytes as they are. The spec
carries strings as hex `bytes` precisely so a byte sequence that is not valid
UTF-8 is still expressible, and the rig must establish whether trails can pack
it at all.

## Acceptance criteria

- [ ] Length boundaries for both families: 0, 31, 32 (fixstr to str8), 255, 256
      (str8 to str16), 65535, 65536 (str16 to str32), and the same for bin8/16/32.
- [ ] A UTF-8 spec packs as `str` and an ASCII-8BIT spec packs as `bin`,
      matching the gem.
- [ ] Multibyte content covered: 2-, 3- and 4-byte sequences, so that a
      byte-length versus character-length confusion in a header is caught.
- [ ] Invalid-UTF-8 byte sequences and lone surrogates are attempted; the
      outcome is recorded as a corpus case if it matches, or as a documented
      boundary in `build.ts` citing root CLAUDE.md if it provably cannot.
- [ ] Other encodings the gem treats as `str` (US-ASCII) covered.

## Notes

If invalid UTF-8 turns out to be unrepresentable through the TS packer, that is
a finding worth writing down rather than a reason to drop the case: it bounds
what a trails process can round-trip from a Ruby one.
