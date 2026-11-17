---
title: "actionview: list ruby_tracker.rb in unported-files so the inheritance gate stops reporting RubyTracker"
status: ready
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actionview --inheritance` (trails `b48364e0eb`,
2026-11-17) reports actionview inheritance at **76/77**. The one miss is:

```text
dependency-tracker/tse-tracker.ts:RubyTracker  ruby<(none)>  ts<class missing>
```

`DependencyTracker::RubyTracker`
(`vendor/rails/actionview/lib/action_view/dependency_tracker/ruby_tracker.rb`)
will not be ported. The 0123 story
`render-parser-and-ruby-tracker-when-a-handler-needs-them` was closed as
FALSIFIED because the tracker parses Ruby template source, and trails has no
handler that compiles Ruby source. The `render_parser.rb` file and its two
`render_parser/*` siblings already carry that reasoning in
`scripts/parity/unported-files/actionview.ts:51-70`. `ruby_tracker.rb` does
not, so `parity:api` maps it onto `dependency-tracker/tse-tracker.ts` (the
file table shows `ruby_tracker.rb → tse-tracker.ts`, 9/9) and then looks for a
`RubyTracker` class in that file.

This row is the last inheritance miss for actionview.

## Acceptance criteria

- [ ] `ruby_tracker.rb` is added to `scripts/parity/unported-files/actionview.ts`
      with a reason that cites the closed 0123 story, in the same style as the
      `render_parser.rb` entries.
- [ ] `pnpm parity:api --package actionview --inheritance` reports no
      inheritance mismatches.
- [ ] Any ratchet or baseline the exclusion changes is updated in the same PR.
      This includes `unported-files/baseline.json`, the method total, and any
      body pins or call-mismatch excludes keyed on `ruby_tracker.rb`. The PR
      body states the totals before and after.
