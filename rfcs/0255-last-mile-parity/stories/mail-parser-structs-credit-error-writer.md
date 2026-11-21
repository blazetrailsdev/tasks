---
title: "mail: credit error= on the ten parser Structs"
status: ready
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: mail
packages: [mail]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` lists `error=` on 10 `vendor/mail/2.8.1/lib/mail/parsers/*_parser.rb`
files. Each defines a `Struct.new(..., :error)`, whose writer the port does not
expose or the extractor does not credit.

## Acceptance criteria

- [ ] Each parser's Struct exposes `error` read and write, and `parity:api` credits `error=` on all 10.
- [ ] mail's API missing count is 0.

## Verification

```sh
pnpm parity:api --missing --package mail  # 0 rows
```

## Findings

The ten failing parsers are `module`s in Ruby (`AddressListsParser` &c.),
ported as `extend({ ... })` object literals with `error: 0`;
`PhraseListsParser` is a Ruby `class` with `static error = 0` and already
credits. Each failing file also defines a `Struct.new(..., :error)`, so Ruby
records `error=` at both levels (the Struct's instance writer and the module's
`class << self; attr_accessor :error`). `compare.ts`'s `bothLevels` arm then
needs a class-level `error` owner, but `harvestObjectLiteralMethods`
(`scripts/api-compare/extract-ts-api.ts`) records an `extend()` literal's
members at instance level, so the module's slot never pairs. Emitting a writer
for each `dataSlots` slot was tried and does not change the count; the fix is
seating `extend()` literal members at the module's singleton level.
