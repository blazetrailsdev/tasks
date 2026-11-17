---
title: "loofah-scrubbers-map-remaining-scrubbers"
status: draft
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10264 ported `Loofah::Scrubber`, `ScrubBehavior` and `Loofah::Scrubbers::Strip`
(`packages/html-sanitizer/lib/loofah/scrubbers.ts`), but `Scrubbers::MAP` holds only `strip`.
Loofah's `MAP` (`vendor/loofah/v2.24.0/lib/loofah/scrubbers.rb:407-419`) also maps `escape`,
`prune`, `whitewash`, `nofollow`, `noopener`, `noreferrer`, `targetblank`,
`newline_block_elements`, `unprintable` and `double_breakpoint` to their classes in that file.
So `ScrubBehavior.resolveScrubber("prune")` (`packages/html-sanitizer/lib/loofah/concerns.ts`)
raises `ScrubberNotFound` where Loofah succeeds.

## Acceptance criteria

- Every `Scrubbers` class in `scrubbers.rb` is ported at its Loofah name in
  `packages/html-sanitizer/lib/loofah/scrubbers.ts`, with `initialize` / `scrub` mirrored.
- `Scrubbers::MAP` has every key from `scrubbers.rb:407-419`.
- The matching cases from `vendor/loofah/v2.24.0/test/` (the scrubber tests) are ported with
  verbatim names.
