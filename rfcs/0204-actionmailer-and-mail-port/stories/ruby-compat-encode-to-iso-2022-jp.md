---
title: "ruby-compat-encode-to-iso-2022-jp"
status: claimed
updated: 2026-11-01
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-11-01T01:54:44Z"
assignee: "testtask-direct-loader-libs-reach-load-path"
blocked-by: null
closed-reason: null
---

## Context

`unstructured_field_spec.rb` "should encoded with ISO-2022-JP encoding" sets `charset = 'iso-2022-jp'`, and `fold` (`vendor/mail/2.8.1/lib/mail/fields/unstructured_field.rb:136-138`) reaches `Encodings.transcode_charset`. `packages/ruby-compat/src/string/encode.ts:118-120` raises `ConverterNotFoundError` for UTF-8 to ISO-2022-JP, because it has no encoder for a stateful multibyte destination. Expected Ruby output: `Subject: =?ISO-2022-JP?Q?=1B$B$=22$$$&$=28$*=1B=28B?=`.

## Acceptance criteria

- [ ] `encode` converts UTF-8 to ISO-2022-JP as MRI does.
- [ ] The spec above is ported under its verbatim name and passes.
