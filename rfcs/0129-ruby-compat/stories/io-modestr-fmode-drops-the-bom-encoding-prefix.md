---
title: "rb_io_modestr_fmode drops the bom| prefix arm, so FMODE_SETENC_BY_BOM is never set"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7551 while converging
`io-external-encoding-ports-one-of-three-arms`, which ported
`rb_io_modestr_fmode` (`vendor/ruby/io.c:6443`) so that `fptr->mode` exists and
`IO#external_encoding` can run its `FMODE_WRITABLE` arm.

That port carries every arm of the C switch except the `':'` one. MRI
(`io.c:6480-6483`):

```c
case ':':
    p = strchr(m, ':');
    if (io_encname_bom_p(m, p ? (long)(p - m) : (long)strlen(m)))
        fmode |= FMODE_SETENC_BY_BOM;
    goto finished;
```

trails' `rbIoModestrFmode` (`packages/ruby-compat/src/io.ts`) breaks out of the
loop at `':'` without the `io_encname_bom_p` test, so `FMODE_SETENC_BY_BOM` is
never set. The omission is cited at the site.

The user-visible consequence is that Ruby's BOM mode prefix does nothing:

```console
$ ruby -e 'File.write("x.txt","hi"); p File.open("x.txt", "bom|utf-8").external_encoding'
#<Encoding:UTF-8>
```

Ruby reads and strips a leading byte-order mark and picks the encoding from it;
trails treats `bom|utf-8` as an ordinary encoding name, so `Encoding.find`
raises `unknown encoding name - bom|utf-8` rather than opening the file.

Two more MRI pieces belong with it, both keyed off the same flag:

- `io_encname_bom_p` / `bom_prefix_len` (`io.c`), the `"bom|"` prefix test.
- `parse_mode_enc`'s BOM branch (`io.c:6800-6810`), which strips the prefix,
  keeps `FMODE_SETENC_BY_BOM` only for a UTF encoding, and warns
  `"BOM with non-UTF encoding %s is nonsense"` otherwise. trails' `parseModeEnc`
  (added by PR #7551) has neither.
- `rb_io_ext_int_to_encs`'s `!(fmode & FMODE_SETENC_BY_BOM)` guard on the
  `intern == ext` collapse (`io.c:6604`), which trails' `rbIoExtIntToEncs` drops
  because it never receives an `fmode`.

## Converged shape

`rbIoModestrFmode` runs the `':'` arm including `io_encname_bom_p`, and the
`fmode` it produces threads into `parseModeEnc` and `rbIoExtIntToEncs` as MRI's
`fmode_p` / `fmode` parameters do — so `"bom|utf-8"` opens, the non-UTF case
warns rather than silently keeping the flag, and the `intern == ext` collapse
respects the BOM bit. Then the read side strips the mark it detected.

Scope check before starting: [[io-read-cannot-bom-sniff-the-utf-16-and-utf-32-dummy-seats]]
covers BOM sniffing at READ time for the UTF-16/UTF-32 dummy seats. This story
is the mode-string half — parsing `"bom|"` and recording the flag. They meet at
the read that consumes the flag, so land them together or make the split
explicit rather than porting the same code twice.

## Acceptance criteria

- [ ] `rbIoModestrFmode` sets `FMODE_SETENC_BY_BOM` for a `"bom|"`-prefixed
      encoding name, and `fmode` threads into `parseModeEnc` /
      `rbIoExtIntToEncs` as it does in MRI.
- [ ] `File.open(path, "bom|utf-8")` opens and answers UTF-8 rather than raising
      `unknown encoding name`; the non-UTF case warns as `parse_mode_enc` does.
- [ ] The arm-specific paragraph on `rbIoModestrFmode`'s doc comment is removed
      once the arm is real.
- [ ] `io.trails.test.ts` and `file.trails.test.ts` keep their names and pass.
