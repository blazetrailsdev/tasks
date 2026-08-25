---
title: "A kwarg string value containing a comma silently skips the whole call site"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6316
claim: "2026-08-10T01:29:37Z"
assignee: "call-args-arel-population-recheck"
blocked-by: null
closed-reason: null
---

## Context

`call-args.ts#splitPairs` (PR #6309) splits a `kwargs{k=…,k2=…}` descriptor on
its top-level commas, tracking `{}` depth so a nested `kwargs{}` value is not
split. It does NOT track string boundaries, because the descriptor grammar has
none: `extract-ruby-api.rb#describe_string` and
`extract-ts-api.ts#describeArg` both emit a string value as a bare
`str:<text>` with the text unescaped and unquoted.

So a kwarg whose value is a string CONTAINING a comma —
`kwargs{sep=str:, }` for Rails' `inject_join(list, collector, ", ")`-shaped
calls, or any SQL fragment kwarg — splits into `sep=str:` and a trailing `}` fragment. The second
fragment has no `=`, `normalizeKwargs` returns null, and the whole site is
silently skipped as uncomparable.

That is an UNDER-approximation, not a false row, so it is safe but lossy: those
sites are exactly the SQL-fragment arguments RFC 0095 §2 calls load-bearing
("byte-comparing SQL fragments is what surfaces the argument-order finding"),
and they are the ones being dropped. The loss is invisible today because nothing
counts skips by reason.

Not measured at the time of filing — arel's flagged population is unchanged by
it, and the activerecord population has not been run through the comparator yet
(`call-args-baseline-seed`). Size the fix against a count first.

## Acceptance criteria

1. Count the sites lost to this on activerecord and arel (a skip-reason tally is
   enough; it need not ship). If the count is zero, close the story with that
   evidence rather than changing the grammar.
2. If non-zero, make the descriptor grammar unambiguous at the comma. Preferred
   shape: both extractors percent- or backslash-escape `,` `=` `{` `}` inside a
   `str:` payload, and `call-args.ts` unescapes after splitting — the grammar
   stays a flat string, which is what makes it cheap to key a baseline row on.
   Do NOT switch the descriptor to JSON: `call-args-ratchet-and-ci-step` keys
   its baseline rows on `rubyArgs` as text.
3. Both extractors and the comparator move together, with a test on each side
   for a string value containing each escaped character.
4. `EXTRACTOR_OUTPUT_FIELDS` cache invalidation is handled per RFC 0095's note —
   the TS extractor's schema token changes, the Ruby manifest self-invalidates
   on the .rb content hash.
