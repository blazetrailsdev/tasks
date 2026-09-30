---
rfc: "0000-psych-in-ruby-compat"
title: "Psych in ruby-compat: move YAML out of activesupport, make `yaml` optional, and give each YAML site its Rails (or receipted) alternative"
status: draft
created: 2026-09-29
updated: 2026-09-29
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - activemodel
  - activerecord
  - actionview
  - actionpack
  - i18n
  - trailties
  - website
clusters:
  - fidelity
related-rfcs:
  - "0129-ruby-compat"
  - "0135-platform-adapters-in-ruby-compat"
  - "0138-ruby-compat-residual-convergence"
  - "0155-assertion-surfaced-port-bugs"
  - "0158-activesupport-assertion-surfaced-port-bugs"
  - "0074-i18n-parity"
---

# RFC — Psych in ruby-compat

## Summary

Ruby's `yaml` is Psych, a stdlib extension shipped with the interpreter
(`vendor/ruby/v3.3.11/ext/psych/lib/psych.rb`, `lib/yaml.rb:20` `YAML = Psych`).
No Rails file defines it. trails hosts it in `@blazetrails/activesupport`
(`packages/activesupport/src/yaml.ts`, exported as the `./yaml` subpath), which
is the inversion `@blazetrails/ruby-compat` exists to remove. That file is
growing into a real Psych port (#8254 adds `YAMLTree`, `ToRuby`, `Coder`,
`dump`, `unsafeLoad`), so the move gets more expensive with every PR.

This RFC:

1. moves Psych into `ruby-compat`, shaped after Psych's own surface (`Psych`
   namespace, `YAML = Psych`, per-file layout mirroring `ext/psych/lib/psych/`)
   with a `vendor/ruby` citation on every export;
2. puts the `yaml` npm package behind a **libyaml seam** in ruby-compat — the
   place MRI's C extension boundary sits (`psych.rb:13` `require 'psych.so'`) —
   resolved synchronously without top-level await, so an app that never
   touches YAML runs without the package, and touching YAML without it raises
   Ruby's `LoadError` (`lib/yaml.rb:3-18`). Under the recommended
   `optionalDependencies` declaration (Q1) the package is still installed by
   default, so "runs without it" means an install with `--omit=optional` (or
   a host that never installed it) works. It does not mean the default
   install drops it;
3. converges every YAML consumer onto the Psych name Rails calls, and records,
   per consumer, whether a JSON/TS alternative exists in Rails, exists as a
   receipted trails invention, or does not make sense;
4. deletes activesupport's `./yaml` subpath (no re-export shim) and the
   website's `yaml-stub.ts`.

## Motivation

- **Wrong home.** `ruby-compat`'s README defines the package as "Ruby core and
  stdlib primitives that trails calls but Rails does not define". Psych is
  exactly that. `packages/ruby-compat/src/json.ts` is the precedent: stdlib
  `JSON` lives there, with a `vendor/ruby` citation and
  `@noRailsEquivalent PERMANENT`.
- **The port is accreting in the wrong package.** #8254 (in progress) adds 209
  lines of Psych visitors to `activesupport/src/yaml.ts`, and four ready
  stories (`psych-dump-type-constants`, `psych-scalar-and-tag-visitors`,
  `activesupport-has-no-psych-emitter-for-to-yaml`,
  `configuration-file-parse-through-psych-unsafe-load`) would add more.
- **Consumers call the npm package, not Psych.** Nine non-test consumers call
  `parse` / `stringify` from `yaml`, directly or through the subpath. Each is a
  silent divergence from what Rails calls: npm `parse` resolves YAML 1.2 core
  schema scalars (`yes` is a String) where Psych's `ScalarScanner`
  (`scalar_scanner.rb:37`) resolves `yes`/`on` to `true`; npm `stringify` of a
  scalar emits `"---\nstr\n"` where `YAML.dump` emits `"--- str\n"`
  (`yaml-scalar-dump-document-marker-spacing`); `YAMLColumn::SafeCoder#load`
  ignores `permitted_classes` because nothing implements `safe_load`.
- **The optional-dependency mechanics are three different hacks.**
  `activesupport/src/yaml.ts` uses a top-level `await import("yaml")`, which
  forced `packages/website/src/stubs/yaml-stub.ts` (and a duplicate
  `DisallowedClass`) plus two Vite plugins; `xml-mini.ts` made its `yaml`
  PARSING entry `async` to avoid that TLA (`xml-mini-parsing-yaml-entry-is-async`);
  `i18n/src/backend/base.ts:62` resolves `yaml` a third time with its own error
  message and a mandatory `preloadTranslationFiles()`; and
  `configuration-file.ts:2` still statically imports `yaml` — an eager edge.
- **Psych's class resolution depends on activesupport.** #8254's `ToRuby`
  resolves `!ruby/object:<Class>` through activesupport's `constantize` and
  names classes through `registeredConstantName`
  (`activesupport/src/inflector.ts:182-240`). In MRI both are core: Psych calls
  `path2class` (`ext/psych/psych_to_ruby.c:22`) → `rb_path_to_class`
  (`vendor/ruby/v3.3.11/variable.c:432`) and `Module#name` (`rb_mod_name`,
  `variable.c:122`). ruby-compat rule 4 (no workspace dependencies) means the
  constant table has to move first.

## Design

### 1. Package home and file layout

Psych lives in `packages/ruby-compat/src/`, mirroring
`vendor/ruby/v3.3.11/ext/psych/lib/`:

| trails file                   | mirrors                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `psych.ts`                    | `psych.rb` — the module functions (`load`, `safeLoad`, `unsafeLoad`, `dump`, …)                            |
| `yaml.ts`                     | `lib/yaml.rb` — `YAML = Psych` (`:20`) and the `LoadError` re-raise (`:3-18`)                              |
| `psych/exception.ts`          | `psych/exception.rb` — `Exception`, `BadAlias`, `AliasesNotEnabled`, `AnchorNotDefined`, `DisallowedClass` |
| `psych/syntax-error.ts`       | `psych/syntax_error.rb`                                                                                    |
| `psych/coder.ts`              | `psych/coder.rb`                                                                                           |
| `psych/class-loader.ts`       | `psych/class_loader.rb` (incl. `ClassLoader::Restricted`, `:76`)                                           |
| `psych/scalar-scanner.ts`     | `psych/scalar_scanner.rb`                                                                                  |
| `psych/omap.ts`               | `psych/omap.rb`                                                                                            |
| `psych/core-ext.ts`           | `psych/core_ext.rb` — `Object#to_yaml` as `toYaml(o, options)`                                             |
| `psych/visitors/yaml-tree.ts` | `psych/visitors/yaml_tree.rb` (incl. `RestrictedYAMLTree`, `:540`)                                         |
| `psych/visitors/to-ruby.ts`   | `psych/visitors/to_ruby.rb` (incl. `NoAliasRuby`, `:430`)                                                  |
| `psych-adapter.ts`            | the libyaml seam under `psych.rb:13` `require 'psych.so'` (§3)                                             |

Public surface is the **`Psych` namespace** (the `export namespace JSON`
shape of `ruby-compat/src/json.ts`) plus `YAML` and `toYaml`. Classes are
members — `Psych.DisallowedClass`, `Psych.Coder`, `Psych.SyntaxError` — never
top-level exports, because top-level names collide: `ActiveSupport::Cache::Coder`
is `export class Coder` at `activesupport/src/cache/coder.ts:209`, and
`SyntaxError` shadows the JS global.

Everything ships from a **`./psych` subpath** of ruby-compat (with `./yaml`
for the alias), never the package root: a root export would put Psych's
module graph behind every `import "@blazetrails/ruby-compat"`.

Rule 1 (only what trails calls) still governs: `Psych::Set`, `load_stream`,
`parse_stream`, `to_json`, `JSONTree`, `Psych::Handler`/`TreeBuilder` event
APIs and `YAML::Store` have no trails caller and are not ported. Each export
lands in the README table with its call site.

### 2. The Ruby constant table moves to ruby-compat

The registered-constant table in `activesupport/src/inflector.ts:182-212`
(`registerConstant`, `unregisterConstant`, `isRegisteredConstant`,
`registeredConstantName`, `_resetConstants`) is Ruby's `Object` constant table
under another name. It moves to `ruby-compat/src/variable.ts` beside the
existing `rbConstGet`, together with `rbPathToClass` (`variable.c:432`) and
`rbModName` (`variable.c:122`). activesupport's `constantize` reads through it.
Psych's `ClassLoader#path2class` (`class_loader.rb:51-56`) calls
`rbPathToClass`; `YAMLTree` names a class through `rbModName`. Story
`ruby-compat-constant-table-and-path2class`.

### 3. The libyaml seam: optional `yaml`, no top-level await

MRI splits Psych at a C boundary: the Ruby layer (`TreeBuilder`, `ToRuby`,
`YAMLTree`, `ScalarScanner`, `ClassLoader`) sits on `psych.so`, which binds
libyaml (`psych.rb:13`, `ext/psych/psych_parser.c`, `psych_emitter.c`). The
npm `yaml` package is trails' libyaml. The seam sits exactly there, in
`psych-adapter.ts`, modeled on the RFC 0135 platform seams
(`ruby-compat/src/zlib-adapter.ts:119,269-304`):

- `registerPsychAdapter(name, adapter)` / a `psychAdapter` config seat, for
  hosts that must register explicitly (the website's IIFE bundle).
- **Synchronous auto-resolution in Node** — `yaml@2` ships a CommonJS build,
  so a `createRequire`-based load answers on first use with no await and no
  warm-up step. This is what removes the top-level await and lets
  `xml-mini`'s `yaml` entry and i18n's `loadYml` be synchronous again.
- A miss raises `LoadError("cannot load such file -- yaml")` **at the call
  site**, the JS spelling of `lib/yaml.rb:3-18` re-raising the `LoadError`
  from `require 'psych'`. Importing a module that names Psych never fails.
- The seam's interface is declared in ruby-compat with its own minimal types,
  so no emitted `.d.ts` references `yaml`'s types: a TypeScript consumer
  without the package still type-checks.
- Psych's Ruby-level tables — `load_tags`, `dump_tags`, `domain_types`
  (`psych.rb:697-738`), `add_tag` / `add_builtin_type` (`:682-692`) — need no
  backend. Registering a tag at module load (`strong_parameters.rb:1066`,
  `time_with_zone.rb:608-609`, `active_record.rb:570-573`) therefore works
  without `yaml` installed, as it must: those registrations run on every boot.

**Dependency declaration.** `ruby-compat/package.json` declares `yaml` under
`optionalDependencies` (Q1 below). `@blazetrails/activesupport` and
`@blazetrails/i18n` drop their `optionalDependencies` on `yaml`.
ruby-compat's README rule 4 sentence "`package.json` has no `dependencies`
block" is amended to: no `dependencies` block and no workspace dependency of
any kind; the single `optionalDependencies` entry is the npm backend of a Ruby
C extension, reached only through its seam.

### 4. Psych surface (names)

`docs/ruby-ts-conventions.md` camelCases a Ruby method and keeps a constant's
spelling. Rule 1 cuts the list to what a Rails body trails ports actually
calls:

| export                                                                                                   | caller                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Psych.load`                                                                                             | `xml_mini.rb:83`                                                                                            |
| `Psych.safeLoad` / `Psych.unsafeLoad`                                                                    | `yaml_column.rb:35-41`, `schema_cache.rb:236`, `encrypted_configuration.rb:118`, `configuration_file.rb:32` |
| `Psych.loadFile` / `Psych.unsafeLoadFile`                                                                | `change_generator.rb:124`; `configuration_file.rb:26`, i18n `base.rb:264`                                   |
| `Psych.dump` / `Psych.safeDump`                                                                          | `yaml_column.rb:17-23`, `schema_cache.rb:411`, `database_statements.rb:521`, via `to_yaml`                  |
| `Psych.loadTags` / `Psych.dumpTags`                                                                      | `strong_parameters.rb:1063-1064`, `time_with_zone.rb:608-609`, `active_record.rb:570-573`                   |
| `Psych.addBuiltinType` (+ the `domainTypes` table it writes)                                             | `ordered_hash.rb:5`                                                                                         |
| `Psych.Exception`, `SyntaxError`, `BadAlias`, `AliasesNotEnabled`, `AnchorNotDefined`, `DisallowedClass` | raised by the above; rescued at `configuration_file.rb:37`, `encrypted_configuration.rb:42,122`             |
| `Psych.Coder`, `Psych.Omap`, `Psych.ClassLoader`, `Psych.ScalarScanner`                                  | the visitors; `fixture_set/file.rb:77` (`YAML::Omap`)                                                       |
| `toYaml` (`Object#to_yaml`)                                                                              | `debug_helper.rb:30`, `xml_mini.rb:62`, both generators                                                     |
| `YAML`                                                                                                   | every `YAML.` spelling above; `serialization.rb:214` (`coder == ::YAML`)                                    |

Not ported, for want of a caller: `safe_load_file`, `add_tag`,
`add_domain_type`, `remove_type`, `Psych::VERSION` (Rails' `>= 5.1` /
`respond_to?(:unsafe_load)` checks at `yaml_column.rb:14,32` are class-body
arm selection, and the port takes the modern arms), and `dump`'s `io`
argument (every Rails caller writes the returned String). Each function keeps
Psych's full kwargs as one camelCased options bag (`permitted_classes:`,
`permitted_symbols:`, `aliases:`, `symbolize_names:`, `freeze:`, `filename:`,
`fallback:`, `strict_integer:`), because parameter names are gated. The
distinction between `fallback:` being `nil` and being absent is kept
(`psych.rb:271,322,368`). `Object#to_yaml` is `toYaml(o, options)`, with a
`RUBY_COMPAT_EXPORTS` row `["Object#to_yaml", "toYaml"]`.

npm-shaped `parse` / `stringify` are **not** Psych names — `Psych.parse`
(`psych.rb:398`) returns a node tree, not a value — so they do not survive
the move as Psych exports. Until a consumer converges, it calls the backend
through the seam, visibly unconverged; the seam's pass-through leaves the
public surface when the last consumer converges
(`psych-seam-drops-backend-pass-through`).

### 5. Consumer matrix

"Hot" means reached on an ordinary boot or request of an app that never wrote
YAML; "opt-in" means reached only when the app chose a YAML file or a
YAML-coded column.

| consumer (trails)                                                         | Rails source                                                                                                              | path                                                                                                | JSON / TS alternative                                                                                                                                                                                                                         | story                                                                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `activerecord/src/coders/yaml-column.ts` `SafeCoder`                      | `coders/yaml_column.rb:8-57`                                                                                              | opt-in                                                                                              | **Rails has it:** `serialize :x, coder: JSON` (`serialization.rb:210`), required under `load_defaults 7.1` (`configuration.rb:289` sets `default_column_serializer = nil`). The YAML coder itself has no alternative — it IS the YAML format. | `yaml-column-safe-coder-through-psych`, `serialize-accepts-yaml-module-as-coder`                                                             |
| `activerecord/src/store.ts` default coder                                 | `store.rb:270`                                                                                                            | opt-in                                                                                              | **Rails has it:** `store :x, coder: JSON`; or a native `json` column with `store_accessor`. Default stays YAMLColumn.                                                                                                                         | (none; follows YAMLColumn)                                                                                                                   |
| `connection-adapters/schema-cache.ts` `_loadFrom` / `dumpTo`              | `schema_cache.rb:228-240,405-414`                                                                                         | opt-in (file exists only after `db:schema:cache:dump`)                                              | **Rails' alternative is Marshal**, a `.dump` filename (`:232,408`), not JSON. trails has no Marshal port. No JSON arm (Q3).                                                                                                                   | `schema-cache-dump-and-load-through-psych`                                                                                                   |
| `abstract/database-statements.ts` `withYamlFallback`                      | `abstract/database_statements.rb:519-525,621`                                                                             | opt-in (fixture value is a Hash/Array in a non-json column)                                         | None: Rails stores the YAML text. `.ts` fixtures reach it too.                                                                                                                                                                                | `with-yaml-fallback-through-yaml-dump`                                                                                                       |
| fixtures: `fixture-set/file.ts` via `ConfigurationFile`                   | `fixtures.rb:782-788`, `fixture_set/file.rb:67-80`                                                                        | opt-in (test)                                                                                       | **trails already has it:** `.ts` fixture modules (`File.registerModule`, `@noRailsEquivalent PERMANENT`). No JSON arm: `.ts` already covers data-only fixtures.                                                                               | `fixture-file-validate-accepts-psych-omap`                                                                                                   |
| `activesupport/src/configuration-file.ts`                                 | `configuration_file.rb:21-45`                                                                                             | opt-in                                                                                              | None at this layer; alternatives live at its callers (next rows).                                                                                                                                                                             | `configuration-file-parse-through-psych-unsafe-load` (existing)                                                                              |
| database config: `trailties/src/database.ts`                              | `application/configuration.rb:399,416-464`                                                                                | **hot today via .ts/.json**                                                                         | **trails already has it:** `config/database.ts` (generated) and `config/database.json`. Rails' `config/database.yml` arm is missing and is added, opt-in. The TS/JSON arms get `@noRailsEquivalent PERMANENT` receipts citing this RFC.       | `database-configuration-reads-config-database-yml`                                                                                           |
| `Application#configFor`                                                   | `application.rb:288-312`                                                                                                  | opt-in                                                                                              | **trails already has it:** `config/<name>.ts` / `.js`. Rails' `.yml` arm is missing and is added.                                                                                                                                             | `config-for-reads-yml-through-configuration-file`                                                                                            |
| credentials: `encrypted-configuration.ts` `deserialize`                   | `encrypted_configuration.rb:115-124`                                                                                      | hot once credentials are read (Rails reads `secret_key_base` from them, `configuration.rb:504-514`) | None (Q2). The plaintext format is YAML by definition; `SECRET_KEY_BASE` is Rails' own escape hatch for the hot read.                                                                                                                         | `encrypted-configuration-deserialize-through-psych-unsafe-load`                                                                              |
| i18n `Backend::Base#loadYml`                                              | i18n `backend/base.rb:261-272`                                                                                            | opt-in                                                                                              | **Upstream has it:** `load_json` (`base.rb:276-285`, ported as `loadJson`) and `load_rb` (ported as `loadJs`). Framework locales are `.ts` (`activesupport/src/locale/en.ts`); `trails new` writes `config/locales/en.json`.                  | `i18n-load-yml-through-psych-unsafe-load-file`                                                                                               |
| `actionview/src/helpers/debug-helper.ts`                                  | `debug_helper.rb:28-36`                                                                                                   | opt-in (dev)                                                                                        | None: `debug` output is YAML by definition.                                                                                                                                                                                                   | `debug-helper-through-object-to-yaml`                                                                                                        |
| `activesupport/src/xml-mini.ts` PARSING / FORMATTING `yaml`               | `xml_mini.rb:62,83`                                                                                                       | opt-in (`Hash.from_xml` disallows `yaml` by default, `conversions.rb:149`)                          | None: the entry is keyed on the YAML type attribute.                                                                                                                                                                                          | `xml-mini-parsing-yaml-entry-is-async` (existing)                                                                                            |
| `activemodel/src/attribute-set/codecs/yaml.ts` `yamlCodec`                | none (trails invention, no non-test caller)                                                                               | —                                                                                                   | Deleted, not given an alternative: `YAMLEncoder` + Psych is Rails' path.                                                                                                                                                                      | `delete-attribute-set-yaml-codec`                                                                                                            |
| Psych object protocol: record / relation `to_yaml`                        | `core.rb:498-502,587-591`, `relation.rb:348`                                                                              | opt-in                                                                                              | None: it IS the YAML format.                                                                                                                                                                                                                  | #8254, `psych-dump-type-constants`, `relation-to-yaml-psych-dump`                                                                            |
| devcontainer / db:system:change generators, `compose.yaml`                | `devcontainer_generator.rb:146-150`, `change_generator.rb:120-145`                                                        | opt-in (generate time)                                                                              | trails writes JSON into `compose.yaml` (valid YAML) and reads it back with `JSON.parse`, which fails on a hand-edited block-style file. Converged onto Psych; no alternative kept.                                                            | `devcontainer-generator-dumps-compose-yaml-through-to-yaml`, `change-generator-edits-compose-yaml-through-psych-load-file`                   |
| tag registrations: Parameters, TimeWithZone, AR legacy names, OrderedHash | `strong_parameters.rb:1059-1088`, `time_with_zone.rb:174-181,608-609`, `active_record.rb:570-573`, `ordered_hash.rb:5-31` | **hot** (module load)                                                                               | n/a: they only write Psych's tables, which need no backend (§3).                                                                                                                                                                              | `parameters-yaml-hook-and-coder`, `time-with-zone-yaml-tags-and-coder`, `active-record-legacy-yaml-load-tags`, `ordered-hash-omap-yaml-type` |

Unaffected: `core-ext/hash/conversions.ts` (`DISALLOWED_TYPES` is a string
list), `source-annotation-extractor.ts` (registers a comment regex for `.yml`),
the `application/x-yaml` MIME registrations, `package-manager.ts`
(`pnpm-lock.yaml` is a filename), and `scripts/**`, which import `yaml` as a
root devDependency for tooling.

So **no hot path requires YAML** once §3 lands: database config and
`configFor` default to TS, framework locales are TS, tag registrations need no
backend, and the only production-hot YAML read is credentials, which an app
avoids with `SECRET_KEY_BASE`.

### 6. Sequencing against in-flight work

- **#8254 (`psych-object-protocol-for-record-yaml-round-trip`, in progress) is
  not disrupted.** Both foundation stories depend on it: the constant-table move
  would break its `./inflector.js` import, and the file move would conflict with
  its 209-line addition to `yaml.ts`.
- The four ready Psych stories in 0155/0158 gain a dependency on
  `move-activesupport-yaml-into-ruby-compat-psych` and a prose note naming the
  new home. They stay in their RFCs. `psych-scalar-and-tag-visitors` loses its
  `load_tags` / `dump_tags` bullet to `psych-load-tags-dump-tags-and-domain-types`
  and its `active_record.rb:570-572` mention to
  `active-record-legacy-yaml-load-tags`.
- `xml-mini-parsing-yaml-entry-is-async` and
  `yaml-scalar-dump-document-marker-spacing` (drafts in the retired 0023
  bucket) gain dependencies on the stories that make them convergeable.
- `relation-to-yaml-psych-dump` and `store-yaml-dump-load-model-round-trip`
  are blocked on #8254 only; the move does not change that, so they are left
  alone.
- **If #8254 stalls or is reshaped.** The move's dependency on it is about
  conflicts, not content: the move relocates whatever `activesupport/src/yaml.ts`
  holds when it is claimed. So if #8254 is closed or rescoped,
  `psych-object-protocol-for-record-yaml-round-trip` is re-filed or closed and
  both foundation stories drop it from `deps`. The constant-table story's only
  coupling is #8254's one `./inflector.js` import line, so that story may also
  go first by agreement with #8254's author, who then rebases one import.
- **The seam is on every consumer's path, not every surface story's.** Phase 2
  stories build Psych's Ruby layer against the adapter interface the move
  creates, and the seam story changes only how that interface resolves its
  backend (RFC §3). It must change no API a phase-2 story uses, which is an
  acceptance criterion of the seam story. Every phase-3/4 story that reaches
  the backend depends on the seam, so no consumer ships on the TLA'd adapter.
- **References to this RFC from other RFCs' stories are number-free** ("the
  psych-in-ruby-compat RFC"). `scripts/finalize-rfc.mjs` rewrites `0000-` ids
  only inside this RFC's own directory (`:67-76`), so a numbered reference
  written elsewhere now would go stale at merge.

## Non-goals

- **A JSON schema-cache dump.** Rails' non-YAML format is Marshal. A `.json`
  arm would be an invented format. See Q3.
- **Porting Marshal** for the schema cache's `.dump` arm or `debug`'s
  `Marshal.dump(object)` probe (`debug_helper.rb:29`). Marshal is its own port,
  filed as `0154-ruby-compat-surfaced-deviations/ruby-compat-has-no-marshal-for-schema-cache-and-debug`.
  The two stories that meet it carry `@missingRailsCall … — CONVERGEABLE`
  receipts pointing there.
- **JSON fixtures.** `.ts` fixture modules already give a YAML-free fixture
  format. A third format adds nothing.
- **`to_yaml` removal via `undef`** (`type/serialized.rb:6`,
  `postgresql/type_metadata.rb:8`, `mysql/type_metadata.rb:7`). trails'
  `toYaml` is a function, not a method on `Object.prototype`, so there is
  nothing to undefine.
- **Psych APIs with no trails caller** (§1, rule 1).
- **Replacing the `yaml` npm package with a hand-written libyaml.** The seam
  exists so that the backend can be swapped. Writing a new one is out of scope.

## Alternatives considered

- **Keep Psych in activesupport; only fix the optional-dep mechanics.** Rejected:
  that leaves the inversion ruby-compat exists to remove, and every Psych story
  lands in the wrong package.
- **A hard `dependencies` entry on `yaml`.** Simplest. Rejected per the
  requirement that a YAML-free app install and run without it.
- **Keep the top-level `await import("yaml")`.** Rejected: it is why the
  website stub, two Vite plugins, the async `xml-mini` entry and i18n's
  mandatory preload exist, and it breaks every CJS/IIFE consumer.
- **Inject class resolution into Psych instead of moving the constant table.**
  Rejected: `rb_path_to_class` is Ruby core, and README rule 4 says "if a
  primitive here appears to need a trails module, the primitive is not a Ruby
  primitive". The table is the primitive.
- **Top-level `Coder` / `DisallowedClass` exports.** Rejected: `Coder` collides
  with `ActiveSupport::Cache::Coder` and `SyntaxError` with the JS global.

## Rollout

1. **Foundation** — `ruby-compat-constant-table-and-path2class`,
   `move-activesupport-yaml-into-ruby-compat-psych` (the pure move),
   `psych-libyaml-seam-without-top-level-await`, `yaml-absent-install-smoke`.
2. **Psych surface** — `psych-restricted-class-loader-and-no-alias-ruby`,
   `psych-load-and-safe-load`,
   `psych-safe-dump-and-restricted-yaml-tree`,
   `psych-syntax-error-and-exception-hierarchy`, `psych-load-file-family`,
   `psych-scalar-scanner-tokenize`, `psych-load-tags-dump-tags-and-domain-types`,
   `psych-object-to-yaml`, `psych-omap`, `port-yaml-dump-and-to-yaml-specs`,
   `port-yaml-load-and-load-file-specs`; plus the existing
   `psych-scalar-and-tag-visitors`, `psych-dump-type-constants`,
   `activesupport-has-no-psych-emitter-for-to-yaml`.
3. **Consumers onto Psych** — `yaml-column-safe-coder-through-psych`,
   `serialize-accepts-yaml-module-as-coder`,
   `schema-cache-dump-and-load-through-psych`,
   `with-yaml-fallback-through-yaml-dump`, `debug-helper-through-object-to-yaml`,
   `encrypted-configuration-deserialize-through-psych-unsafe-load`,
   `i18n-load-yml-through-psych-unsafe-load-file`,
   `parameters-yaml-hook-and-coder`, `time-with-zone-yaml-tags-and-coder`,
   `active-record-legacy-yaml-load-tags`, `ordered-hash-omap-yaml-type`,
   `fixture-file-validate-accepts-psych-omap`, `delete-attribute-set-yaml-codec`;
   plus the existing `configuration-file-parse-through-psych-unsafe-load`,
   `xml-mini-parsing-yaml-entry-is-async`,
   `yaml-scalar-dump-document-marker-spacing`.
4. **Rails' YAML arms beside trails' TS/JSON arms** —
   `database-configuration-reads-config-database-yml`,
   `config-for-reads-yml-through-configuration-file`,
   `devcontainer-generator-dumps-compose-yaml-through-to-yaml`,
   `change-generator-edits-compose-yaml-through-psych-load-file`.
5. **Close-out** — `psych-seam-drops-backend-pass-through`.

## Verification

- `grep -rn 'from "yaml"\|import("yaml")' packages/*/src` outside
  `ruby-compat/src/psych-adapter.ts` and the website's registration: **0**
  (today: `activesupport/src/yaml.ts`, `configuration-file.ts:2` and
  `i18n/src/backend/base.ts:63`, plus the website stub).
- `packages/activesupport/src/yaml.ts`, the `./yaml` subpath,
  `packages/website/src/stubs/yaml-stub.ts` and both `stubActivesupportYaml`
  Vite plugins: **deleted**.
- `yaml-absent-install-smoke`: every package root imports, and a YAML-free AR
  boot (SQLite, `database.ts`, `serialize coder: JSON`, `.json` locale, `.ts`
  fixture) passes with `yaml` unresolvable, while `YAML.load("a: 1")` raises
  `LoadError` "cannot load such file -- yaml".
- No module reachable from any package root contains a top-level `await`
  (guard in `scripts/test-deps/yaml-optional-dependency.test.ts`).
- `parity:test` for ruby-compat: ≥ +30 from `spec/ruby/library/yaml`: ≥ +18
  from `port-yaml-dump-and-to-yaml-specs` (`dump_spec.rb` 8 +
  `to_yaml_spec.rb` 21, less OpenStruct/File/Struct skips) and ≥ +12 from
  `port-yaml-load-and-load-file-specs` (`shared/load.rb` 15 +
  `load_file_spec.rb` 1).
- `@missingRailsCall … CONVERGEABLE` tags naming `unsafe_load`, `safe_load`,
  `safe_dump`, `dump` or `to_yaml` in `packages/*/src`: **0**.

## Open questions

1. **Optional-dependency mechanism.** (a) `optionalDependencies` on ruby-compat
   (**recommended**): installed by default, so no existing app breaks. Absence
   is opt-in via `--omit=optional` / `pnpm install --no-optional`. It is the
   mechanism activesupport and i18n already use, now declared once. (b)
   `peerDependencies` + `peerDependenciesMeta.yaml.optional`, the precedent
   `@blazetrails/nokogiri` sets in `activesupport/package.json:138-145`. Absence
   is then the default, and every app with credentials, YAML fixtures or
   YAML-coded columns must add `yaml` itself. `trails new` generates
   `credentials.yml.enc`, so most apps would need it; choosing (b) adds a story
   `app-generator-declares-yaml-dependency`.
2. **Credentials without YAML.** The only production-hot YAML read. (a) None
   (**recommended**): the format is Rails', and `SECRET_KEY_BASE` covers the
   hot read. (b) A trails-invented `credentials.json.enc` arm with a
   `@noRailsEquivalent` receipt. Debatable: it forks the credentials format
   from Rails' tooling.
3. **Schema cache without YAML.** (a) None (**recommended**): the file exists
   only if the app ran `db:schema:cache:dump`, which is opt-in. (b) Port
   Marshal for Rails' own `.dump` arm, a separate RFC. (c) Invent a `.json`
   arm. Rejected in Non-goals, but it is the one consumer where a JSON
   alternative is a real performance/packaging win, so the call is the user's.
4. **Database-config arm order when several files exist.** Rails has only
   `database.yml`. Recommended: `.yml` (Rails' path) first, then `.ts`, `.js`,
   `.json`. The generator only writes one, so the order matters only in a
   hand-assembled app.

## Changelog

- 2026-09-29: initial RFC
- 2026-09-29: review round 1: seam deps on every consumer, #8254 fallback,
  number-free external refs, move / load / Marshal re-sized
- 2026-09-29: self-review: §4 surface cut to Rails-called exports (rule 1),
  parity floor reconciled with the spec stories, Marshal filed in 0154
