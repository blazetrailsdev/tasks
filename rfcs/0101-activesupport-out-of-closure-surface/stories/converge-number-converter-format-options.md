---
title: "converge-number-converter-format-options"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6454
claim: "2026-08-13T02:56:51Z"
assignee: "converge-number-converter-format-options"
blocked-by: null
closed-reason: null
---

## Context

`NumberConverter#format_options` diverges from Rails in two ways, both
pre-existing (the file has looked like this since it landed; PR #6449 only made
the call gate able to _see_ it, by porting `XmlMini_REXML#merge!` and so putting
`merge!` into the gate's ported-name population).

Rails, `vendor/rails/activesupport/lib/active_support/number_helper/number_converter.rb:141-147`:

```ruby
def options
  @options ||= format_options.merge(opts)
end

def format_options
  default_format_options.merge!(i18n_format_options)
end
```

trails, `packages/activesupport/src/number-helper/number-converter.ts:100-109`:
`options` memoizes `formatOptions()` alone and `formatOptions()` folds
`this.opts` in with a third spread, so the `opts` merge sits one method lower
than Rails puts it. The result is the same hash today, but the decomposition is
not Rails'.

The `merge!`/`merge` calls themselves have no TS spelling: Ruby's `Hash#merge!`
is core, not Rails, and trails has no ported analog — the object spread is not a
call node, which is why the divergence is carried as a row in
`scripts/api-compare/call-mismatches-exclude/activesupport/number-helper/number-converter.json`
(added in #6449 with a per-entry reason).

## Acceptance criteria

- `options` and `formatOptions` mirror the Rails decomposition: `opts` is merged
  in `options`, not in `formatOptions`.
- Number-helper tests stay green (the resulting options hash is unchanged).
- Either the baseline row is deleted (if a ported `merge!` analog is the right
  answer and lands), or its reason is narrowed to the spread-is-not-a-call-node
  fact alone.
