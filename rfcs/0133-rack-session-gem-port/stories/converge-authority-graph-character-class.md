---
title: "Derive AUTHORITY's hostname class from Ruby's [[:graph:]] instead of approximating it"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 21
pr: 7393
claim: "2026-09-02T16:33:35Z"
assignee: "converge-forwarded-for-nil-element-type"
blocked-by: null
closed-reason: null
---

## Context

The `AUTHORITY` regex (`vendor/rack/lib/rack/request.rb:722-735`) matches its
hostname alternative with `[[[:graph:]&&[^\[\]]]]*?` — a POSIX `graph`
character (printable, non-space) that is not a square bracket.

trails (`packages/rack/src/request.ts`, the `AUTHORITY` constant ported in
PR #7348) approximates that class as `[^\[\]\s\x00-\x20\x7f]`: not a bracket, not
JS `\s`, not a C0 control or space, not DEL. The two agree on ASCII and on
every case Rack's own `spec_request.rb:138-193` exercises (unicode hostnames,
`technically_invalid.example.com`, embedded and trailing newlines), which is
why the port is green.

But the negated class is a hand-derived approximation of a positive POSIX
class, not a translation of it, and the two are defined over different
alphabets: Ruby's `[[:graph:]]` under UTF-8 is "printable, excluding space",
which turns on Unicode general categories, while JS `\s` is a fixed enumeration
(the Unicode space separators plus a handful of others) and the negation admits
everything else — unassigned code points, unpaired surrogates, C1 controls
(`\x80`-`\x9f`), and format characters like U+200B / U+FEFF, none of which
`[[:graph:]]` accepts. Nothing in the suite pins that boundary, so the
divergence is silent.

## Acceptance criteria

- The hostname class is derived from Ruby's `[[:graph:]]` definition rather
  than hand-approximated — a Unicode property escape spelling under the `u`
  flag (`[^\p{Z}\p{C}\[\]]` or the equivalent the Ruby actually means), or a
  documented equivalence with every divergent code point class enumerated.
- The boundary is pinned by test: for each class named above, assert trails'
  `host` / `hostname` against what MRI answers for the same authority (`ruby`
  is on PATH — check, do not derive). Rack's `spec_request.rb` has no such
  case, so these belong in `packages/rack/src/request.trails.test.ts`.
- `parity:api` rack non-negative; `parity:api:calls` / `:args` gain no rows.
