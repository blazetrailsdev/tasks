---
title: "Relation record delegates (to_fs, ...) call the activesupport Array ports"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8113
claim: "2026-09-25T21:47:29Z"
assignee: "activemodel-error-message-nil-raw-type-cast-to-string"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Relation#to_xml` in trails#8086. That PR made
`Relation#toXml` delegate to activesupport's `Array#to_xml` port
(`packages/activesupport/src/array-utils.ts` `toXml`) through `RECORD_DELEGATES`.

Rails delegates the whole list to `records`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101-104`):
`:to_xml, :encode_with, :length, :each, :join, :intersect?, :[], :&, :|, :+, :-, :sample,
:reverse, :rotate, :compact, :in_groups, :in_groups_of, :to_sentence, :to_fs,
:to_formatted_s, :as_json, :shuffle, :split, :slice, :index, :rindex`. Each is the
Array method.

In `packages/activerecord/src/relation/delegation.ts`, `RECORD_DELEGATES.toFs`
re-implements `Array#to_fs` locally:

- the `:db` arm, `records.map(id).join(",")` / `"null"`
- a default arm, `[${inspect...}]`

activesupport already ports `Array#to_fs`
(`array-utils.ts` `toFs`, `vendor/rails/activesupport/lib/active_support/core_ext/array/conversions.rb`),
and its default arm is `to_s`, not a hand-built inspect list.

## Acceptance criteria

- `RECORD_DELEGATES.toFs` / `toFormattedS` call activesupport's `toFs(records, format)`, as `toXml` now calls `toXmlArray`.
- Audit the other `RECORD_DELEGATES` entries against the Array method each one mirrors. Any entry that re-implements something activesupport or ruby-compat already ports delegates to that port instead.
- The delegation suites (`relation/delegation.test.ts`) stay green with no renamed tests.
