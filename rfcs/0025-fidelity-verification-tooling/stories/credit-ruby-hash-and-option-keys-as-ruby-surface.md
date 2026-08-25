---
title: "Credit Ruby Hash-constant and option-hash keys as Ruby-side names"
status: draft
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Combines two RFC 0025 drafts with one root cause (swept 2026-08-17).

`extra-surface.ts` builds the Ruby-side allowed set from **declaration names** —
Ruby method names, constants, class/module names. A Ruby Symbol or String used
as a **hash key** is none of those, so a faithful port of a Ruby Hash constant
or an options-hash key reads as invented surface.

### Ruby Hash constants ported as object literals

PR #6465 ported `ActiveSupport::XmlMini::PARSING`
(`vendor/rails/activesupport/lib/active_support/xml_mini.rb:66-96`) as an
exported `Record<string, ...>`. Re-measured 2026-08-17: `xml-mini.ts` reports
**11 novel**, including `base64Binary`, `hexBinary` and `yaml` — all three
verbatim `PARSING` keys at `xml_mini.rb:83-85`. The neighbouring keys (`date`,
`symbol`, `integer`, `float`, `string`, `decimal`, `boolean`, `binary`, `file`,
`datetime`, `duration`) score as `moved` only by luck: those spellings happen to
exist as Ruby method names elsewhere in Rails. The pre-existing `FORMATTING`
table in the same file has the same problem, as do `ToTagOptions`' property
names (`skipInstruct`, `skipTypes`, `typeInfo` — all three still novel today).

### Ruby option-hash keys ported as interface fields

PR #6134 (`activesupport-json-encoding-jsongemencoder-port`). Re-measured
2026-08-17: `json/encoding.ts` reports **exactly 1 novel** —
`escapeHtmlEntities`, a field on `EncodeOptions`. It is Rails' own option key,
read at `vendor/rails/activesupport/lib/active_support/json/encoding.rb:62`:

```ruby
if @options.fetch(:escape_html_entities, Encoding.escape_html_entities_in_json)
```

documented as public on `ActiveSupport::JSON.encode` (`encoding.rb:34-37`) and
exercised by the ported test `hash keys encoding option`
(`packages/activesupport/src/json/encoding.test.ts`, from
`vendor/rails/activesupport/test/json/encoding_test.rb:62-72`).

`@noRailsEquivalent` is the wrong instrument for both: it asserts there is no
Ruby counterpart, which is false, and it is what reviewers read as "known extra
surface, not yet removed".

## Converged shape

The Ruby extractor already parses hash literals for the call-argument
descriptors (`describe_hash` / `describe_kwargs` in `extract-ruby-api.rb`).
Emit the keys of a Hash **constant** assignment, and the Symbol keys read via
`@options.fetch(:k, …)` / `options[:k]` in a method body, into the same
Ruby-side name pool the allowed set is built from. Anything not lexically
resolvable stays novel, as today.

## Acceptance criteria

- `pnpm parity:api:extra --package activesupport` reports 0 novel for
  `xml-mini.ts` keys that appear verbatim in `xml_mini.rb`'s `PARSING` and
  `FORMATTING` tables, and 0 novel for `json/encoding.ts`.
- A Ruby Symbol key read through `fetch`/`[]` in a ported body counts as a
  Ruby-side name for the file that reads it.
- A TS object-literal key or interface field with no Ruby key of that name
  still scores novel — cover it with a unit test.
- No package's novel count rises.
