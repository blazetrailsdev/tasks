---
title: "mail: credit error= on the ten parser Structs"
status: claimed
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: mail
packages: [mail]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-21T21:31:42Z"
assignee: "action-pack-assertions-park-criterion-drops-builder-three"
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
