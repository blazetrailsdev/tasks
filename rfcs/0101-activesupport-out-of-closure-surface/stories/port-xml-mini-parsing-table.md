---
title: "Port XmlMini's PARSING typecast table"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6465
claim: "2026-08-13T14:16:33Z"
assignee: "stats-sync-20260813"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::XmlMini::PARSING` (`vendor/rails/activesupport/lib/active_support/xml_mini.rb:66-96`)
is still unported. The four `_parse*` helpers it dispatches to landed
(`packages/activesupport/src/xml-mini.ts` — `_parseBinary`, `_parseFile`,
`_parseHexBinary`), and #6449 landed the REXML backend + default, so
`XmlMini.parse` now returns a hash — but nothing typecasts it.

The table Rails builds, in order, with its `PARSING.update("double" =>
PARSING["float"], "dateTime" => PARSING["datetime"])` aliasing at
`xml_mini.rb:93-96`:
`symbol`, `date`, `datetime`, `duration`, `integer`, `float`, `decimal`,
`boolean`, `string`, `yaml`, `base64Binary`, `hexBinary`, `binary`, `file`.

Trails already has the pieces each proc needs: `Temporal` for date/datetime,
`Duration.parse`, `BigDecimal`, the optional `yaml` dependency, and the three
`_parse*` helpers.

`packages/activesupport/src/xml-mini.test.ts` `ParsingTest` holds 12 skip stubs
(`symbol`, `date`, `datetime`, `duration`, `integer`, `float`, `decimal`,
`boolean`, `string`, `yaml`, `hexBinary`, `base64Binary and binary`) that mirror
`xml_mini_test.rb` and are waiting on this table.

## Acceptance criteria

- `PARSING` lands in `xml-mini.ts` with the Rails key names, order, and the
  `update` aliases, each entry porting its Ruby proc (including the
  `rescue`-arms: `datetime` falls back to `DateTime.parse(...).utc`, `yaml`
  returns the input on a parse error).
- The 12 `ParsingTest` stubs become real tests with the Rails names verbatim.
- `parity:api` / `parity:test` deltas non-negative.
