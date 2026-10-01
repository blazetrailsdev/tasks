---
title: "Host thor/actions.test.ts on Thor::Group and drop the import-boundary test exemption"
status: draft
updated: 2026-10-01
rfc: "0171-thor-port"
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

trails#8311 added `eslint/thor-import-boundary.mjs`: a file under
`packages/trailties/src/thor/` may not import out of `thor/`, nor any `@blazetrails/*` but
`ruby-compat` and `did-you-mean` (`vendor/thor/v1.3.2/thor.gemspec` declares no runtime
dependency). Its config block in `eslint.config.mjs` ignores `**/*.test.ts`, because
`packages/trailties/src/thor/actions.test.ts` builds its `MyCounter` / `ClearCounter` / `A`
hosts on `GeneratorBase` from `../generators/base.js` and uses `assertRaises` from
`@blazetrails/activesupport`.

Thor's own spec does neither. `spec/actions_spec.rb:4-14` builds the runner from `MyCounter`, a
`Thor::Group` in `spec/fixtures/group.thor`, and RSpec is the only assertion library. So the
exemption is a standing exception that exists only until `Thor::Group` is ported
(`port-thor-group`).

## Acceptance criteria

- [ ] `actions.test.ts` hosts `Thor::Actions` on the ported `Thor::Group` fixtures
      (`spec/fixtures/group.thor`), with no import from outside `src/thor/`.
- [ ] The `raise_error(Thor::Error, /…/)` case (`spec/actions_spec.rb:132-134`) keeps one
      assertion without importing `@blazetrails/activesupport`.
- [ ] The `ignores: ["**/*.test.ts"]` line is removed from the `thor-import-boundary` block, and
      `pnpm exec eslint packages/trailties/src/thor` is green.
