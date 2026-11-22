---
title: "mail: port the latin-1 encoding tests over tagged Uint8Arrays"
status: in-progress
updated: 2026-11-22
rfc: "0255-last-mile-parity"
cluster: mail
packages: [mail]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#10536
claim: "2026-11-22T00:07:32Z"
assignee: "actionview-port-atom-feed-helper"
blocked-by: null
closed-reason: null
---

## Context

Five specs ("allows multiple unencoded strings in …" ×3 and two siblings) are
skipped as "no String encoding tag". The describe already builds
ISO-8859-1-tagged `Uint8Array`s (`packages/mail/test/encoding.test.ts:140-144`),
and CLAUDE.md "A String has no encoding tag either" allows a tagged
`Uint8Array`.

## Acceptance criteria

- [ ] The five specs run over tagged `Uint8Array` input and pass.

## Verification

```sh
pnpm vitest run packages/mail/test/encoding.test.ts
```

## Progress

The Subject spec ("should allow you to send in unencoded strings to fields and
encode them") runs: `Field#create_field`'s `unfold`, `CommonField`'s
`ensure_filename_quoted` and `UnstructuredField#fold` now keep the input's
encoding tag on the bytes they rebuild (Ruby's `gsub` / `split` keep it).

The six address-field specs stay `it.skip` under a `BLOCKED:` line naming this
story. They fail in `Encodings.encode_non_usascii`
(`vendor/mail/2.8.1/lib/mail/encodings.rb:170-190`) with
`address.replace is not a function`: the address arrives as an ISO-8859-1
tagged `Uint8Array`, and `encodeNonUsascii`, `bValueEncode` and
`eachBase64ChunkByterange` (`packages/mail/lib/encodings.ts:152-185`) handle
only a JS string. Each needs the tagged-bytes arm Ruby gets from `gsub` /
`split` on a non-UTF-8 String.
