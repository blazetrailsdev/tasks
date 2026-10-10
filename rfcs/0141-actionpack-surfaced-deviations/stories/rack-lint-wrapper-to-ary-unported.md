---
title: "rack-lint-wrapper-to-ary-unported"
status: draft
updated: 2026-10-10
rfc: "0141-actionpack-surfaced-deviations"
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

`to_ary` left the global `SKIP_GROUPS[0]` list in `scripts/parity/conventions.ts` (story
`activerecord-score-core-object-protocol-names`), so `parity:api` now reports
`Rack::Lint::Wrapper#to_ary` (`vendor/rack/v3.1.14/lib/rack/lint.rb:926-934`) as missing:

```ruby
def to_ary
  @body.to_ary.tap do |content|
    unless content == @body.enum_for.to_a
      raise LintError, "#to_ary not identical to contents produced by calling #each"
    end
  end
ensure
  close
end
```

It is reached only where `respond_to?` (`lint.rb:910-916`, `BODY_METHODS`) answers for the wrapped
body. trails: `packages/rack/src/lint.ts` has no `toAry` and no `BODY_METHODS` probe.

## Acceptance criteria

- [ ] `toAry` is ported on the lint wrapper with Rails' body, `LintError` message and `ensure close`.
- [ ] The wrapper answers `toAry` only when the wrapped body does (`lint.rb:910-916`).
- [ ] `pnpm parity:api` reports no missing `to_ary` for rack.
