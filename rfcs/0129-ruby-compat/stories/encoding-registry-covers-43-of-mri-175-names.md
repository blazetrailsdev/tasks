---
title: "Encoding.find's table covers 43 of MRI's 175 registered names, so a Ruby-resolvable charset silently falls to BINARY"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/encoding.ts` (landed by #7450) is trails' port of
Ruby's encoding registry — `Encoding.find` / `enc_find`
(`vendor/ruby/encoding.c:1368`), raising `ArgumentError: unknown encoding
name - <name>` where `str_to_encindex` (`encoding.c:307-313`) does.

Its `ROWS` table is deliberately scoped to the encodings a Rack charset
parameter can carry — 43 canonical names plus aliases — against MRI's 175
(`ruby -e 'puts Encoding.name_list.size'` → 175). The gap is real, not
cosmetic: `Rack::Multipart::Parser#find_encoding`
(`vendor/rack/lib/rack/multipart/parser.rb:489-493`) falls back to
`Encoding::BINARY` for anything the registry rejects, so a part declaring a
charset Ruby resolves and this table lacks silently decodes as binary where
Rails decodes it.

Names currently outside the table that MRI registers include the Emacs/Mac
family (`macRoman`, `macCyrillic`, `macCentEuro`, …), the IBM/CP code pages
(`CP437`, `IBM850`, …), `EUC-TW`, `GB2312`/`GB12345`, `Big5-HKSCS`,
`stateless-ISO-2022-JP`, `UTF-7`, the vendor Japanese sets
(`SJIS-DoCoMo`, `UTF8-KDDI`, …), and the four special aliases `locale` /
`external` / `filesystem` / `internal` beyond the `UTF-8` row's.

The file's own class JSDoc records the scoping as intentional and says "the
table grows with the callers" — this story is that growth, tracked rather
than left as prose.

## Converged shape

Widen `ROWS` toward MRI's registry for every name that has a `TextDecoder`
label, and decide explicitly what to do with the ones that do not (MRI
registers encodings JS has no decoder for at all — `EUC-TW`, `UTF-7`, the
Emacs-Mule and vendor Japanese sets). A registered-but-undecodable name
should still _resolve_ (so `Encoding.find` does not raise where Ruby does
not) while its `decoderLabel` stays `null`, which is the same shape
`ASCII-8BIT` already uses — that keeps the accept/reject criterion Ruby's,
which is the whole point of the registry, even where the decode cannot be.

Cross-check the table against `ruby -e 'Encoding.name_list'` and
`Encoding.aliases` on the pinned `vendor/ruby` ref (v3_3_11) rather than
against WHATWG's label list.

## Acceptance criteria

- [ ] `Encoding.find` resolves every name and alias MRI's `Encoding.name_list`
      carries, or the exclusions are enumerated in the file with a reason.
- [ ] A name MRI registers but JS cannot decode resolves with
      `decoderLabel === null` rather than raising.
- [ ] `encoding.trails.test.ts` asserts the registry against a checked-in
      snapshot of MRI's name list, so drift from the pinned ref is caught.
- [ ] `findEncoding` still falls back to `Encoding.BINARY` only for names Ruby
      itself rejects.
