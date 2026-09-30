---
title: "html-sanitizer-prune-drops-top-level-text"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

`packages/html-sanitizer/src/engine.ts` `safeListSanitize` maps
`prune: true` to sanitize-html's `disallowedTagsMode: "completelyDiscard"`.
That mode also discards top-level TEXT, not just the pruned node:
`new SafeListSanitizer({ prune: true }).sanitize("a<script>x</script>c")`
returns `""`, where rails-html-sanitizer 1.6.2 returns `"ac"`
(`PermitScrubber#scrub_node`, `lib/rails/html/scrubbers.rb:103-110`, removes
only the node; verified with `ruby -e 'require "rails-html-sanitizer"; p Rails::HTML4::SafeListSanitizer.new(prune: true).sanitize("a<script>x</script>c")'`).
Inside an allowed wrapper it already matches (`<p>a<script>x</script>c</p>` → `<p>ac</p>`),
pinned by `safe-list-sanitizer.trails.test.ts` (trails#8263).

## Acceptance criteria

- `SafeListSanitizer({ prune: true })` keeps top-level text around a pruned node:
  `"a<script>x</script>c"` → `"ac"`, matching Ruby.
- A test in `packages/html-sanitizer/src/safe-list-sanitizer.trails.test.ts` pins it.
