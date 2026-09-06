---
title: "IO's non-binary read/write arms hardcode UTF-8 where Ruby reads the stream's external encoding"
status: done
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 37
pr: 7542
claim: "2026-09-05T23:56:30Z"
assignee: "io-external-encoding-is-hardcoded-utf8"
blocked-by: null
closed-reason: null
---

## Context

Ruby streams carry an external encoding, and the non-binary arms of `IO#read`
and `IO#write` use it: `read_all` tags its result through `io_enc_str`
(`vendor/ruby/io.c:3349`) over `io_read_encoding` (`io.c:3358`), and a write
transcodes to it. It is settable per stream — `IO#set_encoding`
(`io.c:13385` `rb_io_set_encoding`) and `File.open`'s `external_encoding:` /
`"r:UTF-8"` mode forms.

`packages/ruby-compat/src/io.ts` has only the binary/non-binary bit
(`this.binary`, from `binmode` or a `b` in the mode) and hardcodes UTF-8 for
the non-binary arm:

```ts
const buffer = this.binary ? binaryBytes(string) : new TextEncoder().encode(string);
...
return this.binary ? binaryString(bytes, total) : new TextDecoder().decode(bytes);
```

That is right for every call site in the repo today — trails' external encoding
is always UTF-8 — so this is a fidelity gap, not a live bug. It becomes one the
moment anything wants `File.open(path, "r:ISO-8859-1")` or `set_encoding`,
which the `Encoding` class in this package (`packages/ruby-compat/src/encoding.ts`)
already has the vocabulary for.

Filed while the surrounding work was in hand (#7465, which introduced the
`this.binary` branch these two arms share).

## Converged shape

Seat an external encoding on `IO` beside `binary` — Ruby's `fptr->encs.enc` —
defaulting to UTF-8, read by both non-binary arms through `Encoding`, and
settable by `IO#set_encoding` (`io.c:13385`) plus `File.open`'s encoding mode
forms. `binmode` stays what it is: the ASCII-8BIT shortcut
(`rb_io_ascii8bit_binmode`, `io.c:6311`), not a separate encoding mechanism.

Port only what a call site needs (README §1): if nothing in the repo opens a
non-UTF-8 stream when this is picked up, the story is `set_encoding` and the
seat, not a full transcoding table.

## Acceptance criteria

- `IO` holds an external encoding, defaulting to UTF-8, cited to
  `vendor/ruby/io.c`.
- `IO#read`'s no-argument arm and `IO#write`'s non-binary arm read it instead
  of naming UTF-8 inline; the `length` arm stays ASCII-8BIT
  (`io_setstrbuf`, `io.c:3278`) whatever the encoding.
- Any member added carries a `vendor/ruby` citation and a
  `@noRailsEquivalent PERMANENT` receipt; `parity:api:extra:gate` passes.
