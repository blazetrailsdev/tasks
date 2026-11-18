---
title: "actionview: stop the inheritance check asking for a RubyTracker class in tse-tracker.ts"
status: done
updated: 2026-11-18
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10271
claim: "2026-11-17T20:06:46Z"
assignee: "actionview-ruby-tracker-inheritance-row"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actionview --inheritance` (trails `b48364e0eb`,
2026-11-17) reports actionview inheritance at **76/77**. This is the one miss
and the last inheritance gap in the package:

```text
dependency-tracker/tse-tracker.ts:RubyTracker  ruby<(none)>  ts<class missing>
```

The miss is deliberate. By operator ruling on 2026-10-18,
`DependencyTracker::RubyTracker` is not ported, and `TSETracker` answers what
it answers. The ruling is recorded in `packages/actionview/CLAUDE.md`
§ "`TSETracker` answers what `RubyTracker` answers". The api-compare file map
reflects that ruling: `ruby_tracker.rb → dependency-tracker/tse-tracker.ts`
matches 9/9 methods. The inheritance check does not reflect it, so it still
looks for a class named `RubyTracker` in that file.

The `render_parser.rb` siblings take a different route. They are listed in
`scripts/parity/unported-files/actionview.ts` because nothing in trails
answers them. Listing `ruby_tracker.rb` the same way would also remove the 9
matched methods, and the ruling credits those to `TSETracker`. So the fix
belongs to the inheritance check, not to the unported-files list.

## Acceptance criteria

- [ ] The inheritance check stops reporting `RubyTracker`. The mechanism that
      does it is scoped to this one Ruby class and carries a reason citing the
      CLAUDE.md ruling. It may be an inheritance-skip entry, or the
      `RUBY_ONLY_CLASSES` exclusion near `scripts/api-compare/compare.ts:3346`
      if that is the existing seam.
- [ ] `ruby_tracker.rb` still maps onto `tse-tracker.ts` with 9/9 methods
      matched, and actionview stays at 3057/3057 methods.
- [ ] `pnpm parity:api --package actionview --inheritance` reports 76/76 or
      77/77, with no mismatches listed. The PR body states the totals before
      and after.

## Definition of done

Adding `ruby_tracker.rb` to `unported-files/actionview.ts` does not close this
story, because it drops the methods the ruling credits to `TSETracker`.
Renaming `TSETracker` or adding a `RubyTracker` alias class does not close it
either, because the ruling says there is no `RubyTracker`.

## Verification

```sh
API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api --package actionview --inheritance | grep -A3 "Inheritance mismatches"
```

This prints nothing once the story is done.
