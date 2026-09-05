---
title: "io-set-encoding-cannot-hold-mri-null-external-encoding"
status: in-progress
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7530
claim: "2026-09-05T19:06:48Z"
assignee: "io-set-encoding-cannot-hold-mri-null-external-encoding"
blocked-by: null
closed-reason: null
---

## Context

PR for `encoding-find-internal-raises-where-mri-answers-nil` widened
`Encoding.find` to `Encoding | null`, matching `enc_find`'s
`UNSPECIFIED_ENCODING` arm (`vendor/ruby/encoding.c:1368-1378`): `internal`
answers `null` while `Encoding.default_internal` is unset.

`IO#set_encoding` (`packages/ruby-compat/src/io.ts:160`) does not have a null
encoding to hold. MRI's `rb_io_set_encoding` (`vendor/ruby/io.c:13474`) routes
the name through `rb_io_extract_modeenc`, and the stream ends up with NO
external encoding — verified against ruby 3.3:

```console
$ ruby -e 'p STDOUT.set_encoding("internal").external_encoding'
nil
```

trails' `IO#enc` is typed `Encoding`, so the port asserts the null away
(`Encoding.find(extEnc)!`) and would record `null` where MRI records "none".
Nothing reads `enc` expecting that, and the shape only shows up for the four
special alias names, so the field stays non-nullable for now.

`StringIO#set_encoding` is the sibling and IS converged in that PR: MRI's
`strio_set_encoding` (`vendor/ruby/ext/stringio/stringio.c:1801-1826`) falls
through `rb_find_encoding` returning NULL into the mode-string path, and the
stream reports `ASCII-8BIT` — so trails resolves the same name to
`Encoding.BINARY` there.

## Acceptance criteria

- `IO#enc` holds MRI's "no external encoding" state rather than an asserted
  non-null `Encoding`, and `IO#externalEncoding` answers `null` for it.
- `IO#setEncoding` drops the `!` and takes the arm `rb_io_set_encoding` takes,
  cited to `vendor/ruby/io.c`.
- A trails test pins `set_encoding("internal")` answering no external encoding
  while `Encoding.default_internal` is unset.
