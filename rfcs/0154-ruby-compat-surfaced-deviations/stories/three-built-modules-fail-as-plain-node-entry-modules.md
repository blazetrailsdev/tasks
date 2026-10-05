---
title: "ruby-compat: string/each, uri/rfc2396-parser and uri/rfc3986-parser throw TDZ as plain-node entry modules"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `psych-restricted-class-loader-and-no-alias-ruby` (trails#8508),
whose entry-module sweep found them already failing on `main`.

CLAUDE.md § "Call-time constant resolution" requires that a built module load
as a plain-node entry module, because a vitest run enters the funnel module
first and masks a TDZ. Three built ruby-compat modules do not, on `main` at
`d1c3d8bad0` and unchanged by trails#8508:

    $ cd packages/ruby-compat && node -e "import('./dist/string/each.js')"
    ReferenceError: Cannot access 'EACH_METHODS' before initialization
    $ node -e "import('./dist/uri/rfc2396-parser.js')"
    ReferenceError: Cannot access 'RFC2396Parser' before initialization
    $ node -e "import('./dist/uri/rfc3986-parser.js')"
    ReferenceError: Cannot access 'RFC3986Parser' before initialization

Sources: `packages/ruby-compat/src/string/each.ts`,
`packages/ruby-compat/src/uri/rfc2396-parser.ts`,
`packages/ruby-compat/src/uri/rfc3986-parser.ts`. Each is read at module scope
by a module it imports, directly or through a cycle. MRI has no counterpart
failure: `require 'uri/rfc2396_parser'` loads on its own
(`vendor/ruby/v3.3.11/lib/uri/rfc2396_parser.rb`), as does
`uri/rfc3986_parser.rb`.

## Acceptance criteria

- [ ] Each of the three built modules imports as a plain-node entry module.
- [ ] The cycle is broken at the edge that closes it (a call-time read where
      Ruby resolves the constant at call time), not by a guard at the read.
- [ ] A sweep importing every `packages/ruby-compat/dist/**/*.js` as entry
      module reports no failure.
