---
title: "Render story and RFC markdown in trailmap"
status: done
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: 8
claim: "2026-09-06T11:55:27Z"
assignee: "render-markdown-in-trailmap"
blocked-by: null
closed-reason: null
---

## Context

The RFC names markdown rendering as a thing trailmap needs and does not have:
"`webhook/markdown.go` has no trails counterpart. An ordinary npm library in
the app is fine — trails' fidelity rules govern the framework, not its
consumers — but worth stating rather than assuming." The show-page story
(`render-the-rfc-and-story-show-pages`) currently absorbs it, which puts a
renderer and two pages under one LOC ceiling.

What has to be reproduced is `webhook/markdown.go` (276 lines, stdlib-only by
choice): ATX headers, fenced code, bullet and ordered lists, blockquotes,
horizontal rules, paragraphs, GFM tables (`mdTableSepRE`, `tableAligns`,
`alignAttr`), and inline code / bold / italic / links. Two behaviours are
project-specific rather than markdown, and are the ones a stock library will
not give you:

- **Wiki links.** `mdWikiRE` (`markdown.go:24-25`) matches `[[story-id]]` and
  `[[story-id|label]]` and renders a cross-story link. Story bodies and RFC
  prose use these; dropping them silently degrades every page.
- **URL safety.** `mdSafeURL` (`markdown.go:272`) gates link hrefs, and the
  renderer escapes all text and trusts only the tags it emits
  (`markdown.go:11-18`). Whatever renders markdown in trailmap must escape or
  sanitize by the same rule — RFC and story bodies are authored by agents, so
  the output is not trusted input.

An npm library plus a small wiki-link and sanitization layer is the expected
shape. Rendering is what the pages need, so this lands before them.

## Acceptance criteria

- Markdown from a story or RFC body renders to HTML from trailmap, callable
  from a view.
- The block and inline constructs `markdown.go` covers all render, tables
  and their alignment included.
- `[[story-id]]` and `[[story-id|label]]` render as links to the story page.
- Link hrefs are gated the way `mdSafeURL` gates them, and body text cannot
  inject markup — covered by a test with a hostile body.
- Output is close enough to ringo's that a reader moving between the two
  dashboards sees the same document; spot-checked against real RFC and story
  bodies from the live database.
