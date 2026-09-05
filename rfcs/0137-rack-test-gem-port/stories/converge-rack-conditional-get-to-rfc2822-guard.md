---
title: "Restore Ruby's guard shape in ConditionalGet#to_rfc2822 and narrow at the caller"
status: draft
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
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

`Rack::ConditionalGet#to_rfc2822` (`vendor/rack/lib/rack/conditional_get.rb:75-79`)
guards with Ruby truthiness plus a length floor:

```ruby
def to_rfc2822(since)
  # shortest possible valid date is the obsolete: 1 Nov 97 09:55 A
  # anything shorter is invalid, this avoids exceptions for common cases
  # most common being the empty string
  Time.rfc2822(since) if since && since.length >= 16
end
```

`packages/rack/src/conditional-get.ts:64` instead guards
`typeof since !== "string" || since.length < 16`. The `typeof` test is a
boundary narrow taken when #7529 widened the response header type to
`Record<string, string | string[]>`, so that `headers["last-modified"]` can now
be typed as an array; it replaced `!since || since.length < 16`.

Flagged in review on PR #7529 as a documented nit rather than a bug: an array
`since` now short-circuits to `null` outright, where Ruby's guard would pass the
`length` check (`Array#length` is its size) and then raise `TypeError` inside
`Time.rfc2822`. `last-modified` and `if-modified-since` are single-valued on
every path that reaches this method, so no live caller distinguishes the two.

## Converged shape

Restore Ruby's guard shape — `since != null && since.length >= 16` — and take
the array narrowing at the caller (`modifiedSince`, `conditional-get.ts:58`)
where the header is read, rather than inside the date parser. That keeps
`to_rfc2822` a line-for-line mirror and puts the JS-only type discrimination at
the boundary where the value stops being a header.

## Acceptance criteria

- [ ] `toRfc2822`'s guard mirrors `conditional_get.rb:78`'s
      `since && since.length >= 16`, with no `typeof` test in the body.
- [ ] Any narrowing the widened header type forces happens at the call site in
      `modifiedSince`, not in `toRfc2822`.
- [ ] `packages/rack/src/conditional-get.test.ts` stays green with no test name
      reworded.
- [ ] `pnpm parity:api` deltas non-negative; both call gates green with no new
      baseline rows.
