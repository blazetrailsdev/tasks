---
title: "Gate the markdown renderer against webhook/markdown.go in CI"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["render-markdown-in-trailmap"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`app/helpers/markdown-helper.ts` (trailmap#8) is a line-for-line port of
btwhooks' `webhook/markdown.go`. It was verified once, by hand, at merge:
120 real RFC and story bodies rendered through both implementations, output
byte identical but for `&#34;` vs `&quot;`. That check lived in a scratch
directory and is gone — nothing in CI holds the two renderers together, so
the next edit to either side drifts silently and the acceptance criterion
"a reader moving between the two dashboards sees the same document" quietly
stops being true.

RFC 0136 already owns the pattern that fixes this: `scripts/equivalence.ts`
runs BOTH implementations over the SAME input and diffs, and is the merge
gate for the ranking port (`.github/workflows/ci.yml`, the `gate` job). The
renderer wants the same treatment, with the RFC/story markdown tree as the
corpus instead of the database.

The one known difference is the double-quote entity: Go's
`html.EscapeString` writes `&#34;`, trails' `htmlEscape` writes `&quot;`.
Same character, so the gate should normalize it rather than force either side
to change.

## Expected shape

A gate script that renders the tasks checkout's markdown tree through the
trailmap helper and through the Go original, and diffs. The Go side is the
awkward half — it is an unexported function in another repo — so decide
between a small exported entry point in btwhooks, a `go test` harness, or a
committed corpus of golden output regenerated from ringo.

## Acceptance criteria

- A `pnpm` script diffs the two renderers over real RFC and story bodies and
  exits non-zero on any difference beyond the documented entity spelling.
- It runs in CI on every PR, alongside the existing `gate` job.
- A deliberate one-character change to the helper turns it red.
