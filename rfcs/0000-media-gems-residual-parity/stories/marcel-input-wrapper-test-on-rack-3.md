---
title: "Run marcel's InputWrapper test against Rack 3's Lint::Wrapper::InputWrapper"
status: draft
updated: 2026-11-09
rfc: "0000-media-gems-residual-parity"
cluster: null
packages:
  - "marcel"
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` marcel 20/20 with one skip:
`packages/marcel/test/mime-type.test.ts:56-57` "gets content type from sources
that conform to Rack::Lint::InputWrapper", parked because the constant is rack
2's (`marcel.gemspec:25`), and trails ports rack 3.2.8 where it is
`Rack::Lint::Wrapper::InputWrapper` (`vendor/rack/v3.2.8/lib/rack/lint.rb:71`,
`:495`). The test checks that marcel reads a source that conforms to the
wrapper's `read` contract, which the rack 3 class still meets.

## Acceptance criteria

- [ ] The test runs with the marcel body against rack 3's `InputWrapper`, with
      its `PERMANENT-SKIP` line removed.
