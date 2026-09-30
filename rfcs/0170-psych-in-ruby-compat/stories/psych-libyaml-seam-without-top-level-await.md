---
title: "Replace Psych's top-level await with a synchronous libyaml seam; delete the website yaml stub"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat", "activesupport", "website"]
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Design §3. After `move-activesupport-yaml-into-ruby-compat-psych`, `ruby-compat/src/psych-adapter.ts`
still resolves `yaml` with a top-level `await import("yaml")`. That TLA is
why `packages/website/src/stubs/yaml-stub.ts` and the two
`stubActivesupportYaml` Vite plugins (`packages/website/vite.config.ts:17-31`,
`vite.sw.config.ts:14-48`) exist, why `xml-mini.ts:121`'s PARSING entry is
`async`, and why the nightly stats sync died once (closed story
`remove-top-level-await-from-activesupport-yaml`).

MRI's boundary is `vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:13` `require 'psych.so'`. A missing
extension surfaces as `LoadError`, re-raised by
`vendor/ruby/v3.3.11/lib/yaml.rb:3-18`. Seam precedent:
`packages/ruby-compat/src/zlib-adapter.ts:119` (`registerZlibAdapter`),
`:269-304` (`tryAutoRegisterNode` / `resolve`), and
`child-process-adapter.ts:50` (`syncBuiltinLoader`). `yaml@2` ships a
CommonJS build, so Node can resolve it synchronously.

## Acceptance criteria

- [ ] `psych-adapter.ts` has no top-level await. It resolves the backend on
      first use: a registered adapter, else a synchronous Node load of `yaml`
      (ESM, CJS / tsx, and vitest all work), else it raises
      `LoadError("cannot load such file -- yaml")` at the call.
- [ ] `registerPsychAdapter(name, adapter)` and a config seat mirror the zlib
      seam. The adapter interface is declared with ruby-compat's own minimal
      types, so no emitted `.d.ts` under `ruby-compat/dist/psych*` mentions
      `yaml`.
- [ ] Psych's Ruby-level tables (load/dump tags) never touch the seam.
- [ ] No API a `psych-*` story uses changes. The adapter interface the move
      created keeps its shape; only how it resolves its backend changes.
      Phase-2 stories may therefore land before this one (RFC §6).
- [ ] Website: `yaml-stub.ts` and both Vite plugins / aliases are deleted. The
      website entry imports `yaml` and calls `registerPsychAdapter`.
- [ ] `scripts/test-deps/yaml-optional-dependency.test.ts` covers every
      `packages/*/src/index.ts`, not four. It asserts no static `from "yaml"`
      outside `psych-adapter.ts`, and no module reachable from a root with a
      top-level `await`.
- [ ] A `psych-adapter.trails.test.ts` covers the unresolvable-backend
      `LoadError` (message and class) and the registered-adapter arm.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych-adapter.trails.test.ts scripts/test-deps/yaml-optional-dependency.test.ts`; Website job green.
