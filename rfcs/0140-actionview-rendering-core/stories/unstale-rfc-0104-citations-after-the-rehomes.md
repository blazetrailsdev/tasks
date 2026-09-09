---
title: "RFC 0140's prose still cites nine stories as RFC 0104's after rehoming them in"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
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

RFC 0140 rehomed 30 open ActionView stories in from RFCs 0104, 0111, 0123, 0127
and 0023 on 2026-09-08 (its own changelog records this), and rehomed 4 more from
0104 at that RFC's sunset on 2026-09-09. The stories moved; the prose citing
them did not.

Nine citations inside `rfcs/0140-actionview-rendering-core/` still attribute
stories to RFC 0104 that now live in 0140 itself, several of them with a status
that is also stale. RFC 0104 is now `status: closed` and reports 0 open stories,
so every "(RFC 0104, ready)" reads as a contradiction:

- `README.md:180` — "(RFC 0104, ready, 90 loc)" for
  `decide-fate-of-the-unconsumed-aot-views-manifest`, which is in 0140.
- `README.md:192` — "most of them in RFC 0104".
- `README.md:243` — "owned by RFC 0104's AOT manifest story".
- `README.md:281` — "the RFC 0104 stories above".
- `stories/cache-expiry-view-reloader.md:54` —
  `port-resolver-caching-and-cache-template-loading` (RFC 0104, ready); in 0140.
- `stories/template-text-html-and-raw-file-classes.md:48` and
  `stories/render-parser-and-ruby-tracker-when-a-handler-needs-them.md:40` —
  `port-html-builder-and-ruby-template-handlers` (RFC 0104, ready); in 0140.
- `stories/decide-fate-of-the-unconsumed-aot-views-manifest.md:46`.
- `stories/renderer-bodies-instrument-and-record-cache-hit.md:42` —
  `actionview-instrumentation` (RFC 0104); in 0140.

This predates the 0104 sunset's second pass, which deliberately left it alone
rather than converge a scattered subset: fixing some of nine and not the rest is
worse than fixing none. The sunset PR fixed only the references its own rehome
made stale (`0112`'s two ledgers, `0136`'s `port-trails-autoloaders`).

`closed-reason` fields citing RFC 0104 are out of scope — they are DB-owned and
are a historical record of why a story was closed.

## Acceptance criteria

- [ ] Every citation in `rfcs/0140-actionview-rendering-core/` that attributes a
      story to RFC 0104 names the RFC that actually holds it today, with the
      story's current status.
- [ ] `grep -rn "RFC 0104" rfcs/0140-actionview-rendering-core/` returns only
      lines that are deliberately historical — the changelog entries recording
      the two rehomes, and the motivation prose about where the stories came
      from.
- [ ] `pnpm validate`, `pnpm format:check` and `pnpm check:owned-fields` pass.
- [ ] No `closed-reason` or other DB-owned frontmatter field is edited.
