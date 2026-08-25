---
title: "Vendor the pinned minitest gem so its citations are checkable"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6531
claim: "2026-08-14T17:15:04Z"
assignee: "call-args-tool-dispatched-identifier-in-argument-position"
blocked-by: null
closed-reason: null
---

# Vendor the pinned minitest gem so its citations are checkable

## Context

trails now ports a real slice of the minitest gem —
`Minitest::Assertion` / `UnexpectedError` / `Skip` / `UnexpectedWarning` /
`BacktraceFilter`, the `Minitest` module seat, and (as of #6525) the whole
reporter stack (`AbstractReporter` … `CompositeReporter`) — all in
`packages/activesupport/src/testing/assertions.ts`, every member carrying
`@noRailsEquivalent PERMANENT` whose reason is "the minitest gem has no
vendored file for the comparator to map onto".

`vendor/` holds `rails`, `date`, `did_you_mean`, `globalid`, `i18n`, `rack` —
each fetched by `pnpm vendor:fetch` off `vendor/sources.ts` — but not minitest,
even though `scripts/parity/pipeline/schema/ruby/Gemfile.lock:32` pins it to a
specific version (5.27.0 today). Two costs already paid:

- The `gem/path.rb:LINE` citations in those doc comments cannot be checked by
  anything; #6525 shipped a full set against 5.25.4 by reading a locally
  installed gem, and they had to be retargeted in review.
- Nothing keeps the citations honest when the pin moves.

## Acceptance criteria

- [ ] `minitest` is registered in `vendor/sources.ts` at the version
      `scripts/parity/pipeline/schema/ruby/Gemfile.lock` pins, and
      `pnpm vendor:fetch` populates `vendor/minitest/`.
- [ ] `scripts/start-worktree.sh` populates it in every worktree the way it
      does the existing vendored sources.
- [ ] Decide and record whether the minitest ports can then drop their
      `@noRailsEquivalent PERMANENT` tags (i.e. whether the comparator can map
      a non-Rails vendored gem at all) — if it can, that convergence is its own
      story, not this one.
