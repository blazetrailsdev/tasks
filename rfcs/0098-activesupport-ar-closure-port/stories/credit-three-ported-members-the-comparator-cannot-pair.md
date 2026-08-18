---
title: "Credit three ported in-closure members the comparator cannot pair"
status: done
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6726
claim: "2026-08-18T21:06:56Z"
assignee: "converge-references-eager-loaded-tables-symbol-to-s"
blocked-by: null
closed-reason: null
---

## Context

Three in-closure members `pnpm parity:api` reports as **missing** are in fact
ported. Each fails for a different reason, and none of them is a port gap — so
none is fixed by writing code that already exists.

**1. `parameterize` — ported to a file the mapping does not expect.**
Rails defines it in `core_ext/string/inflections.rb`, which
`scripts/parity/conventions.ts` maps to `inflector.ts`. trails has it at
`packages/activesupport/src/transliterate.ts:54`, carrying
`Mirrors: Inflector.parameterize` in its JSDoc. Rails' own
`inflections.rb` delegates to `ActiveSupport::Inflector.parameterize`
(`inflector/transliterate.rb`), so the trails placement follows the Ruby
_definition_ while the mapping follows the Ruby _file that declares the
String method_. One of the two has to move or the mapping has to admit it.

**2. `include?` — a nested class the comparator does not pair.**
`DescendantsTracker` spells it `includes(object: T): boolean` at
`packages/activesupport/src/descendants-tracker.ts:34`, indented inside a
nested class body. `docs/ruby-ts-conventions.md:23` explicitly admits
`includes` as a spelling of `include?`, so the NAME is fine — the pairing is
not happening. This is the nested-class measurement hole RFC 0025 carries
(nested-class methods missing from the coverage denominator); confirm whether
the fix belongs there rather than here before writing code.

**3. `parse_json_times` — an attr_accessor, not a method.**
`json/decoding.rb` exposes it as `mattr_accessor`. trails spells it as a
module-level binding plus a setter at `packages/activesupport/src/json.ts:20-23`
(`export let parseJsonTimes` / `setParseJsonTimes`), which is the settled trails
rendering. The extractor counts methods, so the accessor pair is invisible.

## Definition of done

This story does NOT close by porting any of the three — they exist. It closes
when each is either credited by the comparator or carries a reasoned,
call-sited disposition, and the AR-closure rollup moves by the amount credited.

## Acceptance criteria

- [ ] `parameterize` is credited: either the TS definition moves to
      `inflector.ts` (with `transliterate.ts` re-exporting, mirroring Rails'
      own delegation) or `conventions.ts` maps `core_ext/string/inflections.rb`
      to admit it. Whichever is chosen, the reason is stated where the code lives.
- [ ] `include?` on `DescendantsTracker` is credited, or a linked RFC 0025
      story owns the nested-class pairing hole and this criterion is dropped
      with that link recorded here.
- [ ] `parse_json_times` is credited as an accessor pair, or `conventions.ts`
      records why an `mattr_accessor` rendering is not method-countable.
- [ ] `pnpm parity:api` AR-closure rollup rises by the number credited
      (baseline 8917/8943, 99.7%, measured 2026-08-18).
- [ ] No SKIP_GROUPS entry is added to silence a member that is ported.
