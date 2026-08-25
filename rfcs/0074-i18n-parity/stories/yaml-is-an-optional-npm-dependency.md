---
title: "Take yaml as an optional npm dependency, not a hard one"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6077
claim: "2026-08-04T17:25:02Z"
assignee: "yaml-is-an-optional-npm-dependency"
blocked-by: null
closed-reason: null
---

## Context

`yaml` is a hard runtime dependency of `packages/activesupport`
(`packages/activesupport/package.json:92`, `"yaml": "^2.8.3"`), so every
consumer of `@blazetrails/activesupport` installs it whether or not it ever
parses YAML. It should be optional: nothing in trails' own boot path reads a
`.yml` file, and the framework locales are TS modules
(`packages/activesupport/src/locale/en.ts`), not YAML.

The whole YAML surface is already behind **subpath exports**, which is what
makes this tractable — no root import pulls `yaml`:

- `packages/activesupport/src/yaml.ts:1` is the entire module:
  `export { parse, stringify } from "yaml";`, exposed as `"./yaml"`
  (`package.json:69-72`). It is **not** re-exported from
  `packages/activesupport/src/index.ts`.
- `packages/activesupport/src/configuration-file.ts:2` imports `parse` from
  `"yaml"` directly (the `ActiveSupport::ConfigurationFile` port —
  `database.yml`, AR fixtures). Also subpath-only (`package.json:37-39`); the
  only mention in `index.ts` is a comment at `:461`.
- Three downstream importers, none reachable from their package's `index.ts`:
  `packages/activerecord/src/coders/yaml-column.ts:1`,
  `packages/activemodel/src/attribute-set/codecs/yaml.ts:1`,
  `packages/actionview/src/helpers/debug-helper.ts:2` — all import from
  `@blazetrails/activesupport/yaml`.

So with `yaml` absent, `import "@blazetrails/activesupport"` still resolves;
only those four modules fail. That is the blast radius, and it needs to be
verified rather than assumed.

Rails has no counterpart to this decision — Psych is stdlib, so
`require "yaml"` never fails and there is no missing-dependency arm to port.
This is a trails packaging change, not a fidelity change: it must not alter
what any ported body does when `yaml` **is** installed.

### Shape to prefer

Move `yaml` from `dependencies` to `optionalDependencies` and leave the static
imports alone. pnpm installs optional dependencies by default, so the
workspace, CI, and every existing test keep working unchanged, and no
invented indirection is added (CLAUDE.md: no extra abstraction, no wrapper
Rails does not have). The cost is that a consumer who deliberately omits it
gets a raw `ERR_MODULE_NOT_FOUND` from the resolver rather than a written
error.

The alternative — a lazy `module.createRequire` load behind a helper that
throws an "install `yaml`" message — is worth weighing but is **not** the
default: it must stay synchronous (`ConfigurationFile.parse` and
`YAMLColumn#load` are sync, mirroring Ruby's `YAML.load_file`, so
`await import()` is not available), and the helper is public surface with no
Ruby counterpart, so it would need a `@noRailsEquivalent` tag. Take it only if
the raw resolver error is judged unacceptable, and say so in the PR.

## Acceptance criteria

- `yaml` moves out of `packages/activesupport/package.json`'s `dependencies`
  into `optionalDependencies` at the same range (`^2.8.3`).
- With `yaml` installed (the default), behaviour is byte-identical: no ported
  body changes, and `configuration-file`, `yaml-column`, the activemodel yaml
  codec and `debug-helper` keep their current imports and tests.
- The blast radius is verified and recorded in the PR: with `yaml` removed,
  `import "@blazetrails/activesupport"` and the root imports of activemodel /
  activerecord / actionview still resolve, and exactly the four YAML modules
  above fail.
- No new public name is added without a `@noRailsEquivalent` tag; if the
  lazy-require alternative is taken instead, the PR states why the resolver
  error was judged insufficient.
- No baseline row, allowlist entry or skip is added.

## Notes

`[[i18n-load-yml-psych-input-surface]]` depends on this: it has
`packages/i18n` take `yaml` as a direct dependency to replace its hand-rolled
parser, and it should take it in whatever shape this story settles, rather
than adding a second hard dependency edge.
