---
title: "A BOM-less UTF-16/UTF-32 read raises ConverterNotFoundError where MRI raises InvalidByteSequenceError"
status: draft
updated: 2026-09-08
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7614, which gave `ioEncStr`'s label-less arm the BOM dispatch for
MRI's two dummy seats (`fun_si_from_utf_16` / `fun_si_from_utf_32`,
`vendor/ruby/enc/trans/utf_16_32.trans:278,327`). A BOM-prefixed
`"rb:UTF-16"` / `"rb:UTF-32"` read now decodes; a BOM-LESS one still falls
through to the arm's existing raise:

```ts
throw new ConverterNotFoundError(`code converter not found (${enc} to UTF-8)`);
```

(`packages/ruby-compat/src/io.ts`, `ioEncStr`.)

That error class is wrong for these two seats. MRI does have a converter for
them — `fun_si_from_utf_16` IS it — and reaches the `INVALID` arm at
`utf_16_32.trans:290,310` (state 0, no BOM) rather than failing to open a
converter at all. Probed on this host's `ruby` (3.3.11):

```console
$ ruby -e 'File.binwrite("nobom.txt", "\x00h\x00i".b)
           s = File.open("nobom.txt","rb:UTF-16"){|x| x.read}
           begin; s.encode("UTF-8"); rescue => e; p [e.class, e.message]; end'
[Encoding::InvalidByteSequenceError, "\"\\x00h\" on UTF-16"]
```

`Encoding::ConverterNotFoundError` is what `rb_econv_open_exc`
(`vendor/ruby/transcode.c:2097-2105`) raises for a pair with no converter —
correct for `EUC-TW` and the IBM code pages sharing this arm, wrong for
`UTF-16` / `UTF-32`, whose registry rows are `null` only because WHATWG's
`utf-16` label is not MRI's dummy encoding (`encoding.ts:131-136`).

The AC on `io-read-cannot-bom-sniff-the-utf-16-and-utf-32-dummy-seats` asked
only that a BOM-less stream "still raises", so the class was left alone; this
is that residue.

## Converged shape

The two dummy seats take their own `INVALID` arm and raise
`Encoding::InvalidByteSequenceError` with MRI's message shape —
`"<inspected bytes>" on UTF-16` — leaving `ConverterNotFoundError` for the
seats that genuinely have no converter. The error class exists in
`packages/ruby-compat/src/encoding.ts`'s error family or is added beside
`ConverterNotFoundError` if it does not.

## Acceptance criteria

- [ ] A BOM-less `"rb:UTF-16"` / `"rb:UTF-32"` read raises
      `Encoding::InvalidByteSequenceError`, not `ConverterNotFoundError`,
      verified against `ruby -e` for both seats.
- [ ] The message matches MRI's shape for the same bytes.
- [ ] `EUC-TW` and the other label-less rows keep raising
      `ConverterNotFoundError`.
- [ ] `io.trails.test.ts`'s existing no-BOM expectations are updated, not
      deleted.
