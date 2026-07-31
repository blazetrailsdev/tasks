---
title: "Suppress local-var/literal receivers in walk_for_calls"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 200
pr: 5726
claim: "2026-07-31T17:44:32Z"
assignee: "ruby-extractor-record-call-receiver-kind"
blocked-by: null
closed-reason: null
---

## Context

`walk_for_calls` (`extract-ruby-api.rb:2111-2137`) records the callee name for
qualified calls (`:call`, `:command_call`) exactly as it does for
self/implicit calls (`:fcall`, `:vcall`) — with no receiver information at all.
So a plain-Ruby `xs.first`, `opts.fetch`, `h.merge` gets credited against an
unrelated ported method of the same name, and the wide gate demands the port
call it.

This is the largest single noise source. Two variants were measured on the
2026-07-30 tree by instrumenting the extractor:

- aggressive ("self/implicit receiver only"): 5038 → 1636 rows (−3402);
- **conservative ("suppress only provably local-variable or literal
  receivers"): 5038 → 3702 rows (−1336)** ← the chosen variant.

The aggressive variant was rejected: it makes genuine qualified calls to ported
collaborators (`owner.save`, `association.reader`) permanently invisible to the
gate. The conservative variant preserves that signal.

## Acceptance criteria

- `walk_for_calls` distinguishes receiver kind and suppresses a qualified call
  ONLY when the receiver is a local-variable `var_ref` (`:@ident`) or a literal
  (`:array`, `:hash`, `:string_literal`, `:symbol_literal`, `:@int`,
  `:dyna_symbol`).
- `self.x`, instance variables, constants, and method-chain receivers are all
  still recorded — that is the whole point of picking the conservative variant.
- The suppression is expressed in the extractor output or in
  `WIDE_SIGNIFICANT_CALLS`, whichever keeps the narrow RFC 0044 gate's
  population unchanged; if the narrow gate does move, its baseline is reseeded
  in the same PR and the delta is stated in the PR body.
- Changing `extract-ruby-api.rb` changes the shared-cache key
  (`orchestrate.ts` `RAILS_INPUTS`), so a full re-extract is expected — call it
  out in the PR body.
- Baseline reseeded; expected delta ≈ −1336 wide rows.
