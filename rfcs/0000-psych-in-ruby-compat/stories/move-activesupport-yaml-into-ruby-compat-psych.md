---
title: "Move activesupport/src/yaml.ts into ruby-compat as Psych (pure move) and delete the ./yaml subpath"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages:
  [
    "ruby-compat",
    "activesupport",
    "activemodel",
    "activerecord",
    "actionview",
    "trailties",
    "website",
  ]
deps:
  ["ruby-compat-constant-table-and-path2class", "psych-object-protocol-for-record-yaml-round-trip"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Design §1, §4. This is the pure move that the other Psych stories depend on.
After #8254 merges, `packages/activesupport/src/yaml.ts` holds the `yaml`
resolution (top-level `await import("yaml")` → `LoadError`), npm `parse` /
`stringify` pass-throughs, the `CollectionTag` / `YAMLMap` type re-exports,
`DisallowedClass`, `Coder`, `YAMLTree`, `ToRuby`, `dump` and `unsafeLoad`.

Importers (re-grep `@blazetrails/activesupport/yaml`, `./yaml.js` and
`from "yaml"`):

- src: `activemodel/src/attribute-set/codecs/yaml.ts:1`,
  `activerecord/src/coders/yaml-column.ts:1-5`,
  `activerecord/src/connection-adapters/schema-cache.ts:3-4`,
  `activerecord/src/connection-adapters/abstract/database-statements.ts:20`,
  `activerecord/src/legacy-yaml-adapter.ts` (#8254),
  `actionview/src/helpers/debug-helper.ts:2`,
  `activesupport/src/encrypted-configuration.ts:116`,
  `activesupport/src/xml-mini.ts:123`, and
  `activesupport/src/configuration-file.ts:2` (static `from "yaml"`).
- tests: `actionview/src/helpers/debug-helper.test.ts:8`,
  `activerecord/src/{connection-pool.trails,adapters/postgresql/hstore,coders/yaml-column,encryption/extended-deterministic-queries.trails}.test.ts`,
  `activerecord/src/cases/json-shared-test-cases.ts:3`,
  `trailties/src/commands/db.test.ts:29`.
- tooling: `packages/website/vite.sw.config.ts:48` alias,
  `scripts/test-deps/yaml-optional-dependency.test.ts:35` `CROSS_PACKAGE_EDGES`.

Rails anchors for the names: `vendor/ruby/v3.3.11/ext/psych/lib/psych.rb` (`unsafe_load` `:271`, `dump`
`:505`), `psych/exception.rb:23` (`DisallowedClass`), `psych/coder.rb:9`,
`psych/visitors/yaml_tree.rb:15`, `psych/visitors/to_ruby.rb:14`,
`vendor/ruby/v3.3.11/lib/yaml.rb:20` (`YAML = Psych`).

## Acceptance criteria

- [ ] The file moves with `git mv`, so the size check sees a rename and not
      delete + add, into the RFC §1 layout: `ruby-compat/src/psych.ts`,
      `psych/exception.ts`, `psych/coder.ts`, `psych/visitors/yaml-tree.ts`,
      `psych/visitors/to-ruby.ts`, and `yaml.ts` (`YAML = Psych`). Behaviour
      is unchanged, including the top-level await, which
      `psych-libyaml-seam-without-top-level-await` removes.
- [ ] Public surface is the `Psych` namespace (`Psych.dump`,
      `Psych.unsafeLoad`, `Psych.DisallowedClass`, `Psych.Coder`) and
      `YAML`. There is no top-level `Coder` (it collides with
      `activesupport/src/cache/coder.ts:209`). `ToRuby` / `YAMLTree` read
      `rbPathToClass` / `rbModName`, not activesupport.
- [ ] The npm pass-throughs (`parse`, `stringify`, the two types) are not
      Psych names (`Psych.parse`, `psych.rb:398`, returns a node tree). They
      move to `ruby-compat/src/psych-adapter.ts` as the backend reached
      through the seam, receipted as the platform seam under `psych.rb:13`
      `require 'psych.so'`. Each unconverged caller calls it there.
- [ ] Exported from new ruby-compat subpaths `./psych` and `./yaml`, never the
      package root.
- [ ] `yaml` moves from activesupport's `optionalDependencies` to
      ruby-compat's (RFC Q1). The README rule 4 sentence is amended as RFC §3
      words it. The README table gains a row per export.
- [ ] activesupport's `./yaml` export and `src/yaml.ts` are gone. No shim.
- [ ] Website: the `vite.sw.config.ts` alias is repointed and
      `src/stubs/yaml-stub.ts` loses its `DisallowedClass` copy (re-exported
      from ruby-compat). The stub itself is deleted by `psych-libyaml-seam-without-top-level-await`.
- [ ] `eslint/no-ruby-compat-reimplementation-scope.mjs` `rubyCompatAliases`
      gains `{ name: "DisallowedClass", kind: "class", primitive: "Psych::DisallowedClass" }`
      with no exclude row.
- [ ] Every citation resolves under `ruby-compat-needs-mri-citation`, and
      `parity:api:extra:gate` passes (tighten activesupport).

## Verification

`pnpm build && pnpm vitest run scripts/test-deps/yaml-optional-dependency.test.ts packages/activerecord/src/yaml-serialization.test.ts packages/activerecord/src/store.test.ts packages/activerecord/src/coders/yaml-column.test.ts packages/actionview/src/helpers/debug-helper.test.ts`; website build green in CI.
