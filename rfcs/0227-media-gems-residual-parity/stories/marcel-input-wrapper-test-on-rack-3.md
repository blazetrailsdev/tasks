---
title: "Run marcel's InputWrapper test against Rack 3's Lint::Wrapper::InputWrapper"
status: ready
updated: 2026-11-10
rfc: "0227-media-gems-residual-parity"
cluster: null
packages:
  - "marcel"
deps:
  - "rack-lint-input-read-admits-binary-buffer"
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
wrapper's `read` contract, which the rack 3 class still meets. Marcel reads
with a binary buffer (`magic.rb:121`), and trails' wrapper rejects one until
`rack-lint-input-read-admits-binary-buffer` (RFC
`0154-ruby-compat-surfaced-deviations`) lands, so this story depends on it.

## Acceptance criteria

- [ ] `@blazetrails/rack` becomes a devDependency of marcel (it has only
      ruby-compat today, `packages/marcel/package.json:28-30`).
- [ ] The test keeps its Ruby name, which is how `parity:test` matches it, and
      its body uses `Rack::Lint::Wrapper::InputWrapper`. The `PERMANENT-SKIP`
      line is removed.
