---
title: "api:extra counts ported Ruby Hash constant keys as invented surface"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by credit-ruby-hash-and-option-keys-as-ruby-surface (2026-08-17 sweep): same root cause as extra-surface-credits-ruby-option-keys — Ruby Symbol/String hash keys never enter the allowed set. xml-mini.ts re-measured at 11 novel; citations carried forward."
---

## Context

`scripts/api-compare/extra-surface.ts` scores the **keys of an exported object
literal** as TS surface. When that literal is a port of a Ruby Hash constant,
every key whose name is not also a Ruby method name somewhere in Rails is
counted `novel` — i.e. "invented" — even though the key is verbatim Rails.

Measured on PR #6465, which ported `ActiveSupport::XmlMini::PARSING`
(`vendor/rails/activesupport/lib/active_support/xml_mini.rb:66-96`) as an
exported `Record<string, ...>`. `pnpm parity:api:extra --package activesupport`
moved `xml-mini.ts` from 8 novel to 11, the three additions being
`base64Binary`, `hexBinary` and `yaml` — all three literal `PARSING` keys at
`xml_mini.rb:83-85`. The neighbouring keys (`date`, `symbol`, `integer`,
`float`, `string`, `decimal`, `boolean`, `binary`, `file`, `datetime`,
`duration`) score as `moved` only by luck: those spellings happen to exist as
Ruby method names elsewhere in Rails.

The same is already true of the pre-existing `FORMATTING` table in that file,
so this is not new with #6465 — it is just now measurable against a known-good
port. It also affects the `ToTagOptions` interface's property names in the same
file (`skipInstruct`, `skipTypes`, `typeInfo`, …).

Consequence: the metric charges a faithful port for being faithful, and there is
no way to answer it — object-literal keys cannot carry a
`@noRailsEquivalent` JSDoc tag the way a method can, and renaming them would
break the port. A reviewer then has to take "these are Rails hash keys" on the
author's word, which is exactly the kind of unverifiable claim the gate exists
to remove.

## Converged shape

Teach the extractor that the keys of an object literal are data, not surface —
or, if some object keys genuinely are API, match them against the Ruby **Hash
literal keys** in the mapped `.rb` file rather than against the global Ruby
method-name set. The Ruby side is already parsed for `SKIP_GROUPS` and the
option-key comparison (`output/options-key-mismatches.json`), so the Hash-key
population may be cheap to reuse.

Whichever way it goes, `PARSING`'s and `FORMATTING`'s keys in `xml-mini.ts`
should stop being reported as novel without any per-file allowlist being added
— an allowlist here would be the wrong fix, since the port is correct.

## Acceptance criteria

- `pnpm parity:api:extra --package activesupport` no longer counts
  `base64Binary`, `hexBinary`, `yaml` (or the other `PARSING`/`FORMATTING` keys)
  as novel surface, with no new allowlist row.
- A cover over the extractor asserting that a Ruby-Hash-derived object literal's
  keys are not scored, so the behaviour cannot silently return.
- Per-package novel totals move only for this class of name; no unrelated file's
  count changes.
