---
title: "Require every ruby-compat export to carry a resolvable vendor/ruby citation, replacing the parity:api anchor it can never have"
status: draft
updated: 2026-08-29
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["vendor-ruby-mri-source", "ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` cannot ever enrol ruby-compat: MRI's surface is C, so
`scripts/api-compare/extract-ruby-api.rb` extracts nothing — the same finding
that put `compareApi: false` on the `date` entry (`vendor/sources.ts:190-206`),
measured there by RFC 0088's `date-c-source-extractor-decision` spike
(`date: 2 classes, 0 modules, 12 public methods` against 2,805 lines of port).

RFC 0089 concluded from this that the package simply has no anchor. With
`vendor/ruby/` in the tree it has one — it is just a citation rather than an
extraction. This story makes the citation checkable, which is what separates a
real anchor from a JSDoc habit.

The bodies to be anchored already cite MRI by symbol and would pass on day one:
`date.ts:1225-1240` (`rational.c` `nurat_add`, `nurat_s_canonicalize_internal`,
`float_to_r`), `range-ext.ts:1-9` (`range.c` `range_include_internal`,
`str_upto_each`), `core-ext/regexp.ts:1-3` (`re.c` `rb_reg_s_quote`),
`rb-equal.ts:1-9` (`object.c` `rb_equal`), `rb-hash.ts:9-11` (`object.c`,
`array.c`). What none of them carry is a **line**, so none can be checked.

House precedent for a manifest-backed JSDoc requirement is
`eslint/rails-private-jsdoc` over `eslint/rails-private-methods.json`, built by
`pnpm rails-privates:manifest` and run in the `rails-comparison` CI job.

Note the interaction with RFC 0121: a member carrying `@internal` that is absent
from the rails-private manifest needs a `@noRailsEquivalent` receipt to re-enter
the measured surface. Every ruby-compat member is absent from that manifest, so
the pairing is mandatory package-wide rather than case-by-case, and the package
joins that rule's enrollment set here.

## Acceptance criteria

- A lint — `blazetrails/ruby-compat-needs-mri-citation` — requiring every
  exported declaration under `packages/ruby-compat/src/` to carry BOTH a
  `@noRailsEquivalent PERMANENT` receipt and a citation naming a
  `vendor/ruby/<path>:<line>`.
- The citation is **resolved, not pattern-matched**: the file exists under
  `vendor/ruby/` at the pinned SHA and the line number is within the file. A
  citation naming a file the pin does not contain is an error.
- Behaviour when `vendor/ruby/` is absent is explicit and stated in the rule's
  header comment — skip with a clear message rather than fail, so a contributor
  without a fetched vendor tree is not blocked (and so CI, which does fetch, is
  the enforcing run).
- `packages/ruby-compat/` added to the RFC 0121
  `unbacked-internal-needs-receipt` enrollment set — both its `files` list in
  `eslint.config.mjs` and in `eslint/rails-private-jsdoc.config.mjs`, which must
  stay in sync.
- A `.test.mjs` beside the rule covering: resolvable citation (pass), missing
  citation (fail), out-of-range line (fail), missing receipt (fail), absent
  vendor tree (skip).
- `pnpm lint` green on the package as it stands.
