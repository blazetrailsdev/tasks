---
title: "body-pins --pin selects a Ruby file across every package and cannot set a reason"
status: draft
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/body-pins.ts` `--pin <ruby-file>` hands `pinPairs` a `{ rubyFile }` selector
(`body-pins.ts:206-230`, CLI at `:294-300`), and `pinPairs` matches `r.rubyFile !== select.rubyFile`
with no package test. `rubyFile` is package-relative, so a name shared by two gems selects both:
`--pin validations.rb`, `--pin errors.rb`, `--pin attributes.rb` and `--pin attribute_methods.rb`
each pin the activemodel pairs AND the activerecord pairs of the same file name.

A pin records that a port was verified against a Rails body, so this pins pairs nobody verified.
trails#8313 hit it pinning activemodel's 20 value-protocol pairs and had to call `pinPairs` from a
throwaway script scoped to one package. The same script also had to write each pin's `reason` by
hand, because the CLI has no way to pass one — the header (`body-pins.ts:43-44`) says a verified pin
carries a `reason`, and the three `*-verify-and-pin-*` stories each require one.
`activerecord-verify-and-pin-protocol-bodies` (RFC 0174) is next and will meet both.

## Acceptance criteria

- [ ] `--pin <ruby-file>` takes `--package <pkg>` and pins only that package's pairs; without it, a `<ruby-file>` matched in more than one package is refused with the packages listed, rather than pinning all of them.
- [ ] `--reason <text>` sets `reason` on every pin the invocation writes or re-pins (a re-pin without it keeps the prior reason, as today).
- [ ] `pinPairs` unit tests cover the two-package collision and the reason seat; the header usage block documents both flags.
