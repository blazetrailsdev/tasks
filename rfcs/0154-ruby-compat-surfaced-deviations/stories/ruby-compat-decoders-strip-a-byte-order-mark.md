---
title: "ruby-compat's remaining default TextDecoders strip a leading U+FEFF"
status: ready
updated: 2026-10-29
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

A default `new TextDecoder()` strips a leading U+FEFF. MRI never drops a
byte-order mark from a String's bytes. trails#9441 fixed the String path
(`scrub`, `encode`, `force_encoding`, `StringValue`). These decoders were
checked there and left as they were:

- `packages/ruby-compat/src/hash.ts:1215` — a binary key read as a String
- `packages/ruby-compat/src/json.ts:130` — `JSON.dump` of a binary String
- `packages/ruby-compat/src/psych/visitors/yaml-tree.ts:267` — `to_yaml` of a binary String
- `packages/ruby-compat/src/io.ts:1310` — `IO#write` to a stdio file
- `packages/ruby-compat/src/file.ts:586` — file read decoder
- `packages/ruby-compat/src/uri/rfc2396-parser.ts:172` — `URI.decode` of `%EF%BB%BF`

`psych/parser.ts:73` is excluded, because libyaml strips a leading BOM itself.
`string/method-table.ts:291` decodes only ASCII bytes, so it is excluded too.

## Acceptance criteria

- Each site keeps a leading U+FEFF, as MRI does, using `ignoreBOM: true`.
- Each site has a test with a leading BOM that fails without the fix.
