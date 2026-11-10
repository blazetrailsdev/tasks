---
title: "parity:api credits mail's object-literal modules: Mail's module functions and the Ragel parser tables and structs"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (2026-11-09) reports mail at 805/1277, and most of the gap is
surface that exists but is not credited:

- `mail.rb` 0/25: `Mail.new`, `defaults`, `delivery_method`, `deliver`,
  `register_observer`, `random_tag`, `read_from_string`, … are all members of
  the `export const Mail: MailConstants = { … }` object literal in
  `packages/mail/lib/mail.ts:88` (`registerObserver` at :104,
  `readFromString` at :142), mirroring
  `vendor/mail/2.8.1/lib/mail/mail.rb:1-262`.
- The ten Ragel parsers (`parsers/address_lists_parser.rb` 1/47,
  `content_type_parser.rb` 1/35, `received_parser.rb` 1/35, …) each miss
  ~30 members: the `class << self; attr_accessor :_trans_keys, … end` table
  accessors and the `*Struct` members (`ContentTypeStruct#main_type`, …).
  The TS port (`packages/mail/lib/parsers/content-type-parser.ts`) carries them
  as `_transKeys` / `start` / `firstFinal` properties of an `extend({ … })`
  object and as `Struct.new("mainType", …)` fields; only `parse` is credited.

So ~330 of the 472 missing rows are an extractor gap, not a port gap.

This is a trails PR in shared tooling (`scripts/api-compare/`), not a mail
change: every package's credit runs through the same extractor, so a wider rule
can raise or lower another package's matched count. The last criterion guards
that. The same gap hides ported members elsewhere: rake's `FileUtilsExt` and
`PrivateReader::ClassMethods` and zeitwerk's `Registry`. Stories in the
tooling-gems RFC depend on this one for that reason.

## Acceptance criteria

- [ ] `scripts/api-compare/extract-ts-api.ts` credits the members of an exported
      object literal standing for a Ruby module (`Mail`), and of an
      `extend({ … })` module object, under the Ruby module they mirror.
- [ ] A ruby-compat `Struct.new(...)` field list credits the Ruby `Struct.new`
      members (reader and writer) on the named struct constant.
- [ ] A Ragel table accessor ported as a data property credits both the Ruby
      reader and its `=` writer. There is no scoped skip: a data property is
      writable, so the writers are ported and count as matched.
- [ ] Each extractor change has a fixture test in `scripts/api-compare/`.
- [ ] `pnpm parity:api` mail matched rises by at least 330 (to at least
      1135 / 1277), rake's and zeitwerk's rise by the object-literal rows their
      stories name, and no package's matched count falls.
