---
title: "Receipt or converge xml-mini.ts's Builder::XmlMarkup stand-in surface"
status: draft
updated: 2026-08-29
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on the merge commit of `credit-ruby-hash-and-option-keys-as-ruby-surface`
(RFC 0126, PR #7193), `packages/activesupport/src/xml-mini.ts` reports **5 novel**
names, none of which carries a receipt:

```
closeTag, instruct, openTag, XmlStringBuilder, IndentedXmlStringBuilder
```

(`pnpm parity:api:extra --package activesupport`; the other three that used to be
novel — `base64Binary`, `hexBinary`, `yaml` — are now credited as `PARSING` keys.)

All five belong to one cluster: the trails stand-in for Ruby's **Builder gem**.
Rails' `XmlMini.to_tag` drives `options[:builder]`, which is a
`Builder::XmlMarkup` (`vendor/rails/activesupport/lib/active_support/xml_mini.rb:112-140`
calls `builder.tag!`, and `core_ext/hash/conversions.rb:88-96` /
`core_ext/array/conversions.rb:200-212` construct it and call `builder.instruct!`).
The builder gem is not vendored under `vendor/rails/`, so `parity:api` has no Ruby
file to match these against and they score novel.

Current trails shape (`xml-mini.ts`):

- `interface XmlBuilder` — `tag`, `openTag`, `closeTag`, `instruct`, `target`
- `class XmlStringBuilder implements XmlBuilder`
- `class IndentedXmlStringBuilder implements XmlBuilder` (the ActiveModel
  indentation-aware sink)

`tag` and `target` already score `moved` (they collide by name with Ruby methods
elsewhere), which is luck, not credit — the same accident the Hash-key work was
filed to stop relying on. `openTag`/`closeTag`/`instruct` have no such collision.

## Converged shape

Decide which of the two this cluster is, and make the code say so at the call
site rather than leaving it unmeasured:

1. **If it mirrors `Builder::XmlMarkup`** — name the members after the Ruby ones
   (`tag!`, `instruct!` → the conventions-table spelling) so the intent is legible,
   and give each a `@noRailsEquivalent PERMANENT` receipt naming the builder gem
   as an unvendored dependency. `openTag`/`closeTag` have no `XmlMarkup`
   counterpart at all — `tag!` takes a block — so they are a genuine
   TS-language-shortcoming split of one Ruby method and the receipt should say
   exactly that.
2. **If it is a trails invention** — converge it onto the block-taking `tag!`
   shape and delete the split.

Option 1 is the likely answer; the point of the story is that the choice is
currently undocumented and unmeasured, not that it is wrong.

Do NOT close this by adding rows to an allowlist, and do not reach for
`@noRailsEquivalent CONVERGEABLE` without a story id.

## Acceptance criteria

- `pnpm parity:api:extra --package activesupport` reports 0 UNRECEIPTED novel
  names for `xml-mini.ts` (receipted ones score `Allowed`, which is fine).
- Every receipt opens with `PERMANENT` or `CONVERGEABLE <story-id>` and cites the
  builder-gem file or Rails line it stands in for.
- `activesupport`'s total novel count does not rise.
- No change to `xml-mini` runtime behavior: `pnpm vitest run packages/activesupport/src/xml-mini*.test.ts`
  and the `to_xml`/`from_xml` core_ext suites stay green.
