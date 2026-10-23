---
title: "pin-the-esm-deferred-read-premise-in-ci"
status: draft
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
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

RFC 0205 rests on one claim about ESM, and 11 conversion stories are written
against it: an import binding is live and is read when the expression runs, so
a read inside a function or method body is resolved at call time and stays
correct inside a cycle, while a read evaluated during module evaluation can
TDZ.

The claim was verified by hand against node when the rule landed (trails#9270):
a two-module cycle where `a.mjs` has `static seated = Val` from `b.mjs` and a
method reading a function from it. Entering at `b.mjs` throws
`ReferenceError: Cannot access 'Val' before initialization` from the static
initializer; the method read in the same cycle resolves. That check lives in
nobody's CI, so the premise every conversion relies on is prose.

`scripts/test-deps/` already holds the genre — `relation-entry-import-tdz.test.ts`
and `actionpack-entry-import-tdz.test.ts` import built `dist/**.js` modules as
entry modules, which is the check CLAUDE.md § "Call-time constant resolution"
prescribes and the one a vitest run masks.

This is a test-only story. It does not convert anything.

## Acceptance criteria

- [ ] A test under `scripts/test-deps/` builds a minimal two-module ESM cycle
      in a temp directory and asserts, for each entry module: a read inside a
      method body resolves; an `extends` clause, a `static` field initializer,
      a top-level call and a top-level `const` each throw
      `Cannot access '<binding>' before initialization` when entered from the
      side that evaluates first; an instance field initializer resolves.
- [ ] The assertions name the four module-eval shapes CLAUDE.md lists, so a
      future edit to that list fails a test rather than only reading oddly.
- [ ] The test runs under the `other` vitest project, like its two neighbours,
      and takes no dependency on a package build.
- [ ] It cites CLAUDE.md § "Call-time constant resolution" and this story, and
      does not duplicate the two existing entry-import TDZ tests, which check
      real package graphs rather than the language rule.
