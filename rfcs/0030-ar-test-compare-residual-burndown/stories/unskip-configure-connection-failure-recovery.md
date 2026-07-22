---
title: "Un-skip 'disconnect and recover on #configure_connection failure' (0023 story closed, skip still present)"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapter.test.ts` still carries
`it.skip("disconnect and recover on #configure_connection failure")` (~line 1209) with a SURFACED DEVIATION comment pointing at RFC 0023 story
`adapter-configure-connection-failure-propagation` — but that story is marked
**done**. Either the propagation fix landed and the skip is stale (un-skip and
verify against `vendor/rails/activerecord/test/cases/adapter_test.rb:852` —
Rails re-raises the original ConnectionFailed when configure_connection fails
during reconnect), or the story was closed without converging the test, in
which case the deviation is untracked again.

This is the last `it.skip`-based `matchedSkipped` in `adapter_test.rb` after
PR #5086 (RFC 0030 E4) cleared the rest.

## Acceptance criteria

- [ ] Determine whether the propagation fix from
      `adapter-configure-connection-failure-propagation` landed (git log /
      the abstract adapter's reconnect/verify path).
- [ ] If landed: un-skip the test, confirm it passes on all adapter lanes,
      delete the deviation comment.
- [ ] If not landed: converge the propagation (Rails re-raises
      ConnectionFailed) and then un-skip.
- [ ] `test:compare` shows adapter_test.rb with 0 matchedSkipped.
