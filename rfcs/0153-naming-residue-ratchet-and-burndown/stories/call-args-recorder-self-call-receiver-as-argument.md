---
title: "Call-args recorder emits a bare self-call receiver as a positional argument"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 42
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The call-argument recorder in `scripts/api-compare/extract-ruby-api.rb` records a call's receiver as its first `ref:` argument when that receiver is a bare self-call. The TS side records only the real arguments, so the pair is misaligned and gets classified as `burndown`. Found in trails#8005:

- `activesupport/notifications.rb:210`: `instrumenter.instrument(name, payload) { ... }` is recorded as `instrument(ref:instrumenter, ref:name, ref:payload)`. TS `this.instrumenter.instrument(name, payload, block)` is recorded as `(ref:name, ref:payload, ref:block)`.
- `activesupport/message_pack/serializer.rb:20`: `message_pack_pool.unpacker do |unpacker|` is recorded as `unpacker(ref:messagePackPool)`.

Every pair in these rows is off by one position, so no rename can clear them. They inflate the convergeable count RFC 0153 §5 reports.

## Acceptance criteria

- [ ] The Ruby recorder does not emit a self-call receiver as a positional argument, or the TS recorder emits the receiver the same way. Both sides must agree.
- [ ] A recorder unit test covers `instrumenter.instrument(name, payload)`.
- [ ] The rows above re-measure as matched, or as a genuine pair-level difference.
