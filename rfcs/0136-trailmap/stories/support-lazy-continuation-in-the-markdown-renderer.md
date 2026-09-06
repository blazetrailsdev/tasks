---
title: "Support lazy continuation lines in the markdown renderer, once ringo's is retired"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`renderMarkdown` (`app/helpers/markdown-helper.ts`) does not support lazy
continuation lines. A list item whose text wraps onto the next line breaks the
list: the continuation escapes the `<li>` and becomes a paragraph, and the
next item starts a fresh `<ol>`, so every ordered item renders as "1.".

Visible on real content — `rfcs/0109-story-file-lookup/README.md` renders as:

```text
1. Duplicate triage. The agent files a story for a divergence that another
RFC already owns. There is no way to check first.
1. Filing what would have been fixed anyway. A finding in a file that sees
six edits a month gets its own story instead of riding along as a driveby.
```

Screenshots on blazetrailsdev/trailmap#11 show it on the RFC page.

## This is currently CORRECT, and that is the point

The port is faithful. ringo's Go breaks its list on the first non-matching
line too — `webhook/markdown.go`, in the bullet/ordered arm:

```go
    m := re.FindStringSubmatch(lines[i])
    if m == nil {
        break
    }
```

(btwebooks `a49051f`; check with
`git -C <btwebooks> show a49051f:webhook/markdown.go`.) So this is a shared
limitation, not a regression, and it was deliberately NOT fixed in #11:
changing it there would have been a silent divergence from the renderer
trailmap is supposed to match, and would break
[[gate-the-markdown-renderer-against-ringo]] the moment that lands.

## Why it can be fixed later

Once ringo's pages are gone ([[land-the-ringo-read-model-deletion]]) there is
no second renderer to match, and trailmap is free to render markdown
correctly. That is the trigger for this story — it is blocked on that, not on
effort.

## Acceptance criteria

- A wrapped list item stays one `<li>`; a list of `1.`-prefixed items numbers
  1, 2, 3.
- Bullets behave the same way.
- The change is made AFTER ringo's renderer is retired, or made in both at
  once — never in one silently.
- If [[gate-the-markdown-renderer-against-ringo]] still exists, it is retired
  or re-baselined in the same change rather than left failing.
