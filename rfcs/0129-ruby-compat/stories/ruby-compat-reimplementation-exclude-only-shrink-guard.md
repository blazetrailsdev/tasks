---
title: "Enforce the reimplementation exclude JSON's only-shrink and sort invariants"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 24
pr: 7313
claim: "2026-08-31T20:39:10Z"
assignee: "enroll-call-mapping-remaining-packages"
blocked-by: null
closed-reason: null
---

## Context

`eslint/no-ruby-compat-reimplementation-exclude.json` (PR #7234, RFC 0129) is
declared only-shrink in the rule header and in the package README, but nothing
enforces it: the file is a plain sorted JSON array the rule reads, so a PR that
appends a row to silence a fresh flag is green everywhere. Every other
only-shrink register in the repo has a mechanical guard behind the convention —
the call baselines have their reseed-drift check, `parity:api:extra` has
`extra-surface-mark.json` and `parity:api:extra:gate`.

Two properties want pinning, both cheap:

- **Row count never rises.** A committed high-water mark, compared the way
  `extra-surface-mark.json` is, so a new row is a red rather than a review
  catch. Today's count is 17.
- **Rows stay sorted.** The array is alphabetically sorted today; an appended
  row is the exact shape `project_new_baseline_row_must_be_sorted_not_appended`
  describes for the call baselines, where an append passes the gate locally and
  reds a separate drift check on CI.

The rows themselves burn down through the move stories already filed under this
RFC (`move-regexp-escape-to-ruby-compat`, `ruby-compat-comparable`,
`ruby-compat-hash-fetch-and-key-error`, `ruby-compat-symbol-conventions`,
`move-rational-to-ruby-compat`), each of which deletes the rows it converges —
so the mark tightens repeatedly and needs a `tighten` verb, not a reseed.

## Acceptance criteria

- A test (or a script step wired into the Lint job) that fails when the exclude
  JSON has more rows than its committed mark, and when the array is not sorted.
- The mark is only-shrink: a `tighten` path writes it DOWN as move stories
  delete rows, and there is no reseed.
- A `.test.mjs` covering: at the mark (pass), one row over (fail), an
  out-of-order row (fail), fewer rows than the mark (pass, and the tighten path
  narrows it).
- The rule header and `packages/ruby-compat/README.md` name the guard, so
  "only-shrink" stops being a convention a reader has to take on trust.
