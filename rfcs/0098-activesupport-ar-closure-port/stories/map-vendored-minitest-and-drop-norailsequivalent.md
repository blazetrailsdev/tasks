---
title: "Map the vendored minitest gem so the port can drop @noRailsEquivalent PERMANENT"
status: closed
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6535
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do: maintainer decision 2026-08-14 — trails does not port the minitest gem. The vendored gem stays out of parity:api and the @noRailsEquivalent PERMANENT tags stay. Mechanics were proven in PR #6535 and reverted there. File a fresh story if the decision changes."
---

# Map the vendored minitest gem so the port can drop @noRailsEquivalent PERMANENT

## Context

PR #6531 vendored the pinned gem at `vendor/minitest/` (v5.27.0, the version
`scripts/parity/pipeline/schema/ruby/Gemfile.lock:32` pins), registered in
`vendor/sources.ts` with `compareApi: false` / `compareTests: false`. The
citations in `packages/activesupport/src/testing/assertions.ts` are checkable
now, but every ported minitest member still carries
`@noRailsEquivalent PERMANENT` whose stated reason — "the minitest gem has no
vendored file for the comparator to map onto" — is no longer true.

What blocks enrolling it: api-compare/test-compare derive their package list
from `SOURCES` and key each package to a `packages/<name>/src` workspace dir.
There is no `packages/minitest`; the port is a slice of ONE activesupport file
(`testing/assertions.ts`) covering `Minitest::Assertion` / `UnexpectedError` /
`Skip` / `UnexpectedWarning` / `BacktraceFilter`, the `Minitest` module seat
(`vendor/minitest/lib/minitest.rb:44,51,350-354,1065-1218,1230-1238`) and the
whole reporter stack (`minitest.rb:596-1030`).

## Acceptance criteria

- [ ] Decide the mapping shape: either a package entry whose TS root is a FILE
      (`activesupport/src/testing/assertions.ts`), or a `RUBY_FILE_TS_OVERRIDES`
      entry pointing `minitest.rb` at that file, whichever the comparator can
      express without a new indirection layer.
- [ ] With the mapping live, the `@noRailsEquivalent PERMANENT` tags on the
      minitest ports are deleted (they are receipts for surface the comparator
      could not see, not permanent exemptions).
- [ ] `pnpm parity:api` / `pnpm parity:api:extra` deltas non-negative; any
      member that genuinely has no counterpart keeps a tag with a NEW reason.
