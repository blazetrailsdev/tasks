---
title: "A Ruby-core to ruby-compat call resolution table, report-only, folding in CORE_LIBRARY_ALIASES"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 260
priority: 14
pr: 7294
claim: "2026-08-31T14:08:15Z"
assignee: "ruby-core-call-mapping-table"
blocked-by: null
closed-reason: null
---

## Context

The tooling half of the RFC, and the reason the package is worth building rather
than just tidy.

Today `scripts/api-compare/enumerable-idioms.ts:78-89` holds
`CORE_LIBRARY_ALIASES = new Map([["escape", ["regexpEscape"]]])` — one entry,
consumed through `jsEnumerableAliases` (`:92-94`) by `compare.ts`'s call ratchet
and `lint-calls.ts`. It is **silence-only** by contract: it can credit a
differently-spelled TS call, never flag one. Its own doc comment states the gap
this story closes:

> One name, not a list of the spellings that happened to be in the tree: an alias
> list would ratify the divergence this entry exists to make visible, and a body
> that escapes under some other name should still flag.

Three bodies escape under another name (`quote-regex.ts:27`, `run-token.ts:23`,
`trails-actions.ts:191`) and nothing flags.

**Home.** A new `scripts/parity/ruby-compat.ts`, with `CORE_LIBRARY_ALIASES`
folded into it — that entry IS a ruby-compat primitive. `scripts/parity/` because
two tools consume it, which is the "two consumers, so it lives in the shared
home" rule RFC 0092 settled and which `enumerable-idioms.ts:1-8` states for
itself.

**Shape.** A resolution keyed by the **MRI spelling**, not the bare method name:

```ts
export const RUBY_COMPAT_EXPORTS = new Map<string, string>([
  ["Regexp.escape", "regexpEscape"],
  ["Hash#fetch", "fetch"],
  ["Hash#key?", "hasKey"],
  ["Range#cover?", "cover"],
  ["Comparable#<=>", "cmp"],
]);
```

The bare name is ambiguous across receivers: `fetch` is `Hash#fetch`,
`Array#fetch` **and** `ActiveSupport::Cache::Store#fetch`, which is Rails and
must keep flagging normally. The comparator's available receiver signals are RFC
0083's inert-receiver filter (`dropWeakCalls`) and the `FOREIGN_READ_PREFIX`
marking (`enumerable-idioms.ts:126-140`). **Where the receiver cannot be
resolved, the row does not go in the table** — an unresolvable row credits a
Rails `fetch` for a Ruby one, which is worse than the status quo. The value-type
set is
~25 members, so per-row adjudication is tractable; that is a further reason the
"only what we call" rule matters.

**Bidirectional, which is what is new.** Forward: Ruby calls `Regexp.escape`, TS
calls `regexpEscape` imported from `@blazetrails/ruby-compat` → credited, no
mismatch row, no receipt. Reverse: Ruby calls `Regexp.escape`, TS calls a local
`escapeRegExp` or inlines the replace → **a mismatch row**, which converges by
importing the export, not by baselining.

**Rows live in the existing `call-mismatches-exclude/` shards** under a new
`kind: "rubyCompat"`, read only by this gate — exactly as `kind: "args"` is read
only by `parity:api:calls:args` (RFC 0095). Do not invent a second artifact tree.
Edit baseline JSON only through `serializeBaseline` and keep rows sorted; an
appended row passes locally and reds CI's reseed-drift check.

**Expected size, so the report can be sanity-checked rather than trusted.** The
existing baselines already hold 251 Ruby-core rows out of 601 (Motivation §4 of
the RFC) — ~76 `Hash`, 21 `Proc#call`, 12 `Array#join`/`String#split`, 10
`Regexp`, 4 `Kernel#warn`. The report's Hash and Regexp numbers should land in
the same order of magnitude as those. A report that comes back far smaller means
the receiver keying is rejecting rows it should keep; far larger means it is
crediting Rails homonyms. Say which in the PR body.

**This story is report-only.** `pnpm parity:api:calls:ruby-compat:report`. No
package is enrolled, no gate turns red, and nothing in the baselines moves.
Enrollment is `enroll-call-mapping-in-parity-gate` and it is deliberately
separate: seeding a gate red across nine packages blocks every unrelated PR.

## Acceptance criteria

- `scripts/parity/ruby-compat.ts` exporting `RUBY_COMPAT_EXPORTS`, keyed by MRI
  spelling (`Receiver#method` / `Receiver.method`), with a header comment
  recording the receiver-ambiguity rule and the "unresolvable receiver → no row"
  decision.
- `CORE_LIBRARY_ALIASES` deleted from `enumerable-idioms.ts` and its one entry
  moved in; `jsEnumerableAliases` keeps working and `enumerable-idioms`' own
  tests stay green.
- Both directions implemented: forward credit, and reverse detection of a
  hand-rolled substitute.
- `pnpm parity:api:calls:ruby-compat:report` prints the full population, grouped
  by package, with a count — and that count is recorded in the PR body as the
  burndown baseline for the enrollment stories.
- `kind: "rubyCompat"` rows are read only by this gate; `parity:api:calls` and
  `parity:api:calls:args` are provably unaffected (their counts unchanged).
- Report-only: `pnpm parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params`, `parity:api:extra` all unchanged; no baseline reseeded,
  no high-water mark moved.
- Tests beside the new module covering: forward credit, reverse flag, an
  ambiguous receiver being excluded, and the folded `escape` entry.
