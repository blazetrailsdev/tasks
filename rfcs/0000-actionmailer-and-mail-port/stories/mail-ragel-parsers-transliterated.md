---
title: "Transliterate mail's Ragel-generated parsers into TypeScript with a regenerable script"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mail/lib/mail/parsers/*.rb` (12 parsers, 56,441 lines) are Ragel output from
1,360 lines of `.rl`. Ragel 6 has no JavaScript target. Each file is packed
integer tables, a driver loop and action bodies (`AddressListsParser`,
`ContentTypeParser`, `DateTimeParser`, `ReceivedParser`, …).

## Acceptance criteria

- A script under `scripts/` reads each vendored `parsers/*.rb` and writes
  `packages/mail/src/parsers/*.ts`: tables as typed arrays, the driver loop as
  written, action bodies by a fixed rule set; output is marked generated.
- Each parser keeps its Ruby class and struct names (`AddressListStruct`, …).
- `mail`'s `spec/mail/parsers/*_spec.rb` pass.
- Generated files are excluded from the LOC count; the script and hand-written
  driver count.
