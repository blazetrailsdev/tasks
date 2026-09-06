---
title: "IO#external_encoding ports only the FMODE_WRITABLE arm; rb_io_t carries neither enc2 nor mode"
status: done
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 7551
claim: "2026-09-06T12:18:19Z"
assignee: "bigdecimal-round-diverges-from-mri-on-negative-ndigits"
blocked-by: null
closed-reason: null
---

## Context

PR #7530 ported `IO#external_encoding`
(`vendor/ruby/io.c:13407`) so that `IO#set_encoding`'s "no external encoding"
state — MRI's `UNSPECIFIED_ENCODING`, reached through the `internal` alias while
`Encoding.default_internal` is unset — is readable. Verified against ruby 3.3:

```console
$ ruby -e 'p STDOUT.set_encoding("internal").external_encoding'
nil
```

MRI's body has three arms (`io.c:13407-13420`):

```c
if (fptr->encs.enc2)            return rb_enc_from_encoding(fptr->encs.enc2);
if (fptr->mode & FMODE_WRITABLE) {
    if (fptr->encs.enc)         return rb_enc_from_encoding(fptr->encs.enc);
    return Qnil;
}
return rb_enc_from_encoding(io_read_encoding(fptr));
```

trails ports **only the middle one** (`packages/ruby-compat/src/io.ts:174`,
`return this.enc`), tagged `@noRailsEquivalent PERMANENT` with the omission
cited, because this partial port of `rb_io_t` carries neither `encs.enc2` nor
`fptr->mode`:

- `IO` has `enc` but no second encoding, so the transcoding pair
  `io_encoding_set` sets at `io.c:11659-11695` cannot be represented.
- `File.open(fileName, mode)` passes the mode string straight to `openSync`
  (`packages/ruby-compat/src/file.ts:308`) and never records it, so
  `FMODE_WRITABLE` is unknowable and the `io_read_encoding` fallthrough
  (`io.c:1010`, `encs.enc` else `rb_default_external_encoding()`) cannot fire.

Consequence: a **read**-mode stream with no recorded encoding answers `null`
where MRI answers `Encoding.default_external`.

## Converged shape

`rb_io_t`'s seat grows the two fields the ported body needs, and
`externalEncoding` runs all three arms in Rails' order:

- Record the mode on the stream where `File.open` already has it
  (`file.ts:299-309`), as the `FMODE_*` flags `rb_io_binmode` sets alongside the
  existing `binary` field (`io.ts:117-118` already models `FMODE_BINMODE` this
  way, so the field has a precedent to extend rather than a new concept).
- Carry `enc2` beside `enc`, set by the two-argument form of
  `io_encoding_set` (`io.c:11659-11695`).

Then the `@noRailsEquivalent PERMANENT` receipt on `externalEncoding` narrows to
the class-level one `IO` already carries, and the arm-specific note comes out.

`internal_encoding` (`io.c:13440`) is the sibling reader that needs the same two
fields and is unported; it belongs to whichever story lands this.

## Acceptance criteria

- [ ] `IO` records the open mode, and `externalEncoding` runs all three arms of
      `rb_io_external_encoding` in Rails' order.
- [ ] A read-mode stream with no recorded encoding answers
      `Encoding.defaultExternal`, as `io_read_encoding` (`io.c:1010`) does; a
      write-mode one still answers `null`.
- [ ] `set_encoding("internal")` with `Encoding.default_internal` unset keeps
      answering no external encoding — the behaviour #7530 pinned in
      `packages/ruby-compat/src/io.trails.test.ts` must not regress.
- [ ] The arm-specific paragraph on `externalEncoding`'s
      `@noRailsEquivalent PERMANENT` receipt is removed once the arms are real.
