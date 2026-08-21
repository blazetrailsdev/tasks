---
title: "Resolve the four in-closure XML conversions against XmlMini's out-of-closure classification"
status: in-progress
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6818
claim: "2026-08-21T13:20:34Z"
assignee: "move-collection-proxy-transaction-and-clone-to-their-rails-seats"
blocked-by: null
closed-reason: null
---

## Context

Four in-closure members are XML conversions with no trails counterpart:

| Ruby file                                               | members                                  |
| ------------------------------------------------------- | ---------------------------------------- |
| `core_ext/array/conversions.rb`                         | `to_xml`                                 |
| `core_ext/array/extract_options.rb` (→ `hash-utils.ts`) | `to_xml`, `from_xml`, `from_trusted_xml` |

They are 4 of the 26-method gap keeping the AR-closure rollup at
**8917/8943 (99.7%)**, measured 2026-08-18.

## Why this is filed as draft, not ready

**The machinery these need is owned by a postponed RFC.** `Hash#to_xml` /
`Hash.from_xml` route through `ActiveSupport::XmlMini`, and XmlMini is the
explicit scope of RFC `0101-activesupport-out-of-closure-surface` — whose own
framing is "the members AR never loads (cache stores, XmlMini)" and which is
`status: postponed`.

That framing and this measurement disagree, and the disagreement is the point of
this story: **these four members ARE in the AR require-closure** (they are
reached from `activerecord/lib` + `activemodel/lib` by the transitive `require`
walk in `scripts/api-compare/ar-closure.ts`), while the machinery they delegate
to was classified as out-of-closure. So RFC 0098 cannot reach its stated "AR
closure rollup reads 100%" without either porting a slice of XmlMini or
reclassifying these four.

## The decision this needs first

One of:

1. **Port the minimum XmlMini slice** these four members need, inside 0098,
   scoped strictly to what the closure reaches — and record the boundary so it
   does not become a whole-XmlMini port by accretion.
2. **Reactivate RFC 0101** (or split its XmlMini half out as its own active
   RFC) and sequence these four behind it.
3. **Re-derive the closure.** If `to_xml`/`from_xml` are reachable only from a
   `require` AR does not actually take at runtime, fix `ar-closure.ts` and the
   members leave the denominator honestly — which also lowers 0098's target.

Option 3 is the only one that changes the denominator, and it must be settled by
reading the require graph, not by preference: a closure edited to make a number
go up would invalidate every AR-closure figure this RFC is measured by.

## Acceptance criteria

- [x] Option 1 chosen; recorded in RFC 0098's changelog (2026-08-21) with the
      require path quoted from `ar-closure.ts`'s walk. That walk corrects the
      Context above: only `core_ext/array/conversions.rb` is in the closure
      (`activemodel/lib/active_model/errors.rb:3`);
      `core_ext/hash/conversions.rb` and `xml_mini.rb` are not, and the three
      `Hash` members score in-closure by file attribution through
      `core_ext/array/extract_options.rb`. Option 3 is therefore wrong —
      `ar-closure.ts` is accurate.
- [x] The four members are ported and credited by `pnpm parity:api` (all three
      Ruby files report matched N/N; AR closure 8917/8943 -> 8940/8948), and the
      XmlMini surface pulled in is listed explicitly in 0098's changelog.
- [x] N/A — option 3 not taken; `ar-closure.ts` is unchanged and correct.
- [x] RFC 0101's scope statement carries a dated correction reconciling the two.
- [x] `pnpm parity:api:extra` clean (0 novel names added); both call ratchets
      unchanged, no new baseline rows.

## Decision (2026-08-21, backlog triage)

**Port a minimal XmlMini slice under this RFC.** Owner decision: the four
members stay in the AR require-closure and RFC 0098 keeps its "rollup reads
100%" exit — do not reclassify them out, and do not block on RFC 0101
(`postponed`). Port only as much of
`vendor/rails/activesupport/lib/active_support/xml_mini.rb` (plus the default
REXML-equivalent backend seam) as `Hash#to_xml` / `Hash.from_xml` /
`Hash.from_trusted_xml` / `Array#to_xml` actually reach; everything else in
XmlMini stays 0101's.
