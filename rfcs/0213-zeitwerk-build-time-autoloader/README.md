---
rfc: "0213-zeitwerk-build-time-autoloader"
title: "Port Zeitwerk: @blazetrails/zeitwerk, a build-time autoloader"
status: active
created: 2026-10-30
updated: 2026-10-30
owner: "@deanmarano"
packages:
  - zeitwerk
  - ruby-compat
  - activesupport
  - trailties
  - activerecord
  - actionpack
  - activejob
  - actioncable
  - scripts
  - "trails-tsc"
  - "arel"
# The mechanical test sweep is one rename over about 2,100 sites in activerecord.
max-est-loc: 2500
clusters:
  - zw-gem
  - zw-railties
  - zw-lookup
  - zw-framework
related-rfcs:
  - "0205-namespace-seats-are-plain-javascript"
  - "0151-activesupport-autoload-slot-registry"
  - "0212-trailties-port"
  - "0142-trailties-surfaced-deviations"
priority: 3
---

# RFC 0213 — Port Zeitwerk: @blazetrails/zeitwerk, a build-time autoloader

## Summary

Port Zeitwerk the way every other Rails gem dependency is ported: vendor it,
add `@blazetrails/zeitwerk`, keep `Zeitwerk::Loader`'s API at its own names and
port its test suite. Port `Rails.autoloaders` on top. Restore real
`constantize`, `safe_constantize` and `const_get`, reading the namespaces the
loader defined, so Rails bodies such as `compute_type` port line for line.

One deviation is ratified, once: Ruby's `Module#autoload` has no JS equivalent,
so a build step stands in for `Module#autoload` plus `setup`'s directory walk.
Everything above that line is faithful.

**This reverses two owner rulings**, by owner direction on 2026-10-30:

- the 2026-10-28 ruling in root `CLAUDE.md` § "Constant lookup is an import or
  a registry", recorded in RFC 0205;
- the "Trails has no autoloader" ruling in `packages/trailties/CLAUDE.md`,
  including "there is no story to port Zeitwerk".

These reversals take effect when this RFC goes `active`, and not at merge. The
`registerModel` family retires, and RFC 0205's lookup arm is rewritten
(§ "RFC 0205").

## Motivation

**A registry cannot do what `constantize` does.** trails#9466 (held) gives each
`registerX` a name → class map and points `computeType` at it. Rails'
`compute_type`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:255-261`)
goes through `constantize`, so it finds any constant and reaches `const_missing`
on a miss. A model registry does neither, and #9466 had to park three tests in
`packages/activerecord/src/reflection.test.ts`:

- `reflection klass requires ar subclass`
  (`vendor/rails/v8.0.2/activerecord/test/cases/reflection_test.rb:171`) needs
  a `class_name` naming a non-model to resolve, so the "not an
  ActiveRecord::Base subclass" arm is reached;
- `name error from incidental code is not converted to name error for
association` (`:634`) and `automatic inverse does not suppress name error
from incidental code` (`:654`) need `const_missing` to run on a miss.

Those three are the visible cost of a design that leaves a port short of its
Rails body wherever the body looks a constant up. The 2026-10-28 ruling accepted
that cost; this RFC stops paying it.

These three need a namespace-reading `constantize` with a `const_missing` miss
path, and classes seated at definition. They do **not** need a loader: Rails'
`reflection_test.rb` runs with none, requiring its models and letting the `class`
keyword bind the rest. So `constantize-restored-over-namespaces` and the test
seats answer them. The loader is justified by what follows.

**The application scan is an invented loader.** `loadAppClasses`,
`collectAppClasses`, `collectModels` and `loadControllers`
(`packages/trailties/src/application/finisher.ts`) import every file, keep the
exports that subclass a framework base, and hand them to a `registerX`. A file
whose constant is not a subclass of one of those bases has no seat. It has no
expected-constant contract, no `collapse`, no `ignore`, no collision detection,
no `on_load` and no reload. A new app directory needs a new `registerX`.

**The premise of the "no autoloader" ruling was incomplete.** It says "Zeitwerk
is not vendored … so a port would be invented surface with no Ruby source to
mirror". Vendoring removes that objection, and most of `Zeitwerk::Loader` is
file-system and bookkeeping code with nothing Ruby-specific in it. Only the
autoload primitive is missing.

**Three generations of name tables exist.** `registerConstant` /
`RCLASS_CONST_TBL` (`packages/ruby-compat/src/variable.ts`),
`registerClassPaths` / `generatedClasses` (`classpath.ts`, one
`class-paths.generated.ts` per package, 35 files) and the `registerX`
registries all map names and classes. The first two have an open-ended
retirement under RFC 0205 that this RFC replaces with one table.

Current counts, 2026-10-30, `\bname\(` over `packages/`, excluding `dist`:

| name                 | non-test | test |
| -------------------- | -------- | ---- |
| `constantize`        | 34       | 71   |
| `safeConstantize`    | 21       | 16   |
| `rbModConstGet`      | 22       | 9    |
| `registeredConstant` | 17       | 31   |

`registerModel(` appears 2085 times, `registerController(` 129 and
`registerConstant(` 668, tests included.

## Design

### Vendoring and version

Railties asks for `zeitwerk ~> 2.6`
(`vendor/rails/v8.0.2/railties/railties.gemspec:46`), a range and not a
version. Rails 8.0.2's own lockfile resolves it to **2.7.2**
(`vendor/rails/v8.0.2/Gemfile.lock:676`), so that is the pin: tag `v2.7.2`,
commit `6aa28216c8dbea60bea097d7c7e6f4cc5210a080`, added to `vendor/sources.ts`
and `vendor/sources.lock.json` with `libPath: "lib/zeitwerk"`,
`libEntryFile: "lib/zeitwerk.rb"` and `testPath: "test"`. Upstream is at 2.8.3,
which restructures `Cref::Map`; it is not taken. 2.7.2 is 2161 lines of `lib/`
and 6216 of `test/`, about 443 tests.

Citations below are to `vendor/zeitwerk/v2.7.2/`, which exists once the vendor
story lands. They were read from a scratch clone of the tag.

### `@blazetrails/zeitwerk`

File layout follows `lib/zeitwerk/` so `parity:api` pairs it:

| Rails-facing surface                                                                                                                 | Source                    | Port                  |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | --------------------- |
| `push_dir`, `ignore`, `collapse`, `do_not_eager_load`, `enable_reloading`, `tag`, `on_setup`, `on_load`, `on_unload`, `log!`, `dirs` | `loader/config.rb`        | line for line         |
| `Inflector#camelize`, `#inflect`, `GemInflector`, `NullInflector`                                                                    | `inflector.rb`, …         | line for line         |
| `setup`, `unload`, `reload`, `all_expected_cpaths`, `cpath_expected_at`, `unloadable_cpaths`                                         | `loader.rb`               | async where noted     |
| `eager_load`, `eager_load_dir`, `eager_load_namespace`, `load_file`                                                                  | `loader/eager_load.rb`    | async                 |
| `on_file_autoloaded`, `on_dir_autoloaded`, `on_namespace_loaded`                                                                     | `loader/callbacks.rb`     | line for line         |
| `ls`, `walk_up`, `cname_for`, `hidden?`, `ruby?`                                                                                     | `loader/helpers.rb`       | `ruby?` per below     |
| `Cref`, `Cref::Map`, `Registry`, `Registry::ExplicitNamespaces`                                                                      | `cref.rb`, `registry*.rb` | over seats, see below |
| `Error`, `ReloadingDisabledError`, `SetupRequired`, `NameError`                                                                      | `error.rb`                | same messages         |

Bookkeeping keeps its names and meaning: `autoloads`, `to_unload`,
`namespace_dirs`, `shadowed_files`, `autoloaded_dirs`. Collision detection
(`raise_if_conflicting_directory`, `vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb`)
and shadowed-file handling are ported as they stand, and run in the walk, so a
conflict fails the build as well as a boot.

Three things have no port. `core_ext/kernel.rb`'s decorated `require` is
replaced by the seating step below. `core_ext/module.rb`'s `const_added` becomes
a call the loader makes itself, because the loader is what seats a constant
here. `Registry::Inceptions` exists for a `Module#autoload?` edge case with no
counterpart. Each is a `SCOPED_SKIP_GROUPS` entry citing the ruled section.

Three file-name rules are language-level and recorded once:

- `ruby?` answers `.ts` or `.js`, and never `.d.ts`, a test file or an emitted
  twin of a `.ts` file in the same directory.
- A trails file name is kebab-case, so `ls` turns `-` into `_` before calling
  `inflector.camelize`. The inflector, its overrides (`html_parser`) and every
  custom inflector see Ruby's basename. This is what `collectAppClasses` does
  today.
- A file's constant is its **named export** spelled as the `cname`. `post.ts`
  must export `Post`. A file that does not raises Zeitwerk's own error, "expected
  file … to define constant …" (`loader/callbacks.rb:20-32`). A default export
  does not count, because it has no constant name to check.

### The ratified deviation: a build step replaces `Module#autoload`

`define_autoload` calls `Module#autoload`
(`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:542`), which binds a name now
and runs `require` synchronously at first reference. JS cannot do this: no hook
fires on an unresolved identifier, `import()` is async, and JS has no
synchronous await. This is the same shortcoming as root `CLAUDE.md`
§ "An adapter file is loaded by an awaited step" and § "A translation lookup is
synchronous; the load is an awaited step", with the same answer: **the
asynchrony goes at the load, and every read afterwards is as synchronous as
Ruby's.**

The build step runs the ported walk (`define_autoloads_for_dir`, `autoload_file`,
`autoload_subdir`, `promote_namespace_from_implicit_to_explicit`) with one
substitution: where `define_autoload` would call `Module#autoload`, it records a
row. It writes three artifacts per loader to `.trails/autoload/<tag>/`:

- **`manifest.json`:** Ruby cpath → `{ path, export, kind }`, where `kind` is
  `file`, `implicit` (a directory, so `Module.new`) or `explicit` (a file plus
  matching directories), in walk order, plus a digest of the loader's
  configuration.
- **`imports.generated.js`:** a module of thunks over `import()`, one per file,
  so a bundler sees every edge. It is what `eager_load` runs in a build with no
  file system.
- **`constants.generated.d.ts`:** a module augmentation of ruby-compat's
  `ConstantTable` interface mapping cpath → class, so
  `constantize("Admin::UsersController")` is typed for a literal and answers
  `unknown` otherwise. It is the application's own file and is never published,
  so the objection to a `declare global` in a published `.d.ts` (root
  § "Call-time constant resolution") does not reach it.

`setup` reads the manifest and fills `autoloads` and `namespace_dirs` exactly as
the Ruby walk does, which is why everything downstream ports unchanged. It
raises if the digest does not match the running configuration.

**Where configuration comes from.** `push_dir`, `collapse`, `ignore` and
inflections are made by application code, some of it in initializers. So the
step boots the application as far as `setup_main_autoloader`, stops, and walks.
It is the `build-views` shape from root § "Templates are precompiled":
`trails-tsc` gains a build subcommand, and `trails build` runs it.

**In development and test** the same walk runs in process at `setup`, with no
artifact on disk. That is one code path with two callers, so the manifest cannot
disagree with what a boot would have seen. The artifact is required only where
there is no file system, or a bundle needs static edges, and for
`constants.generated.d.ts`.

The receipt is one row: `Kernel#require`'s decoration and `Module#autoload` in
`SCOPED_SKIP_GROUPS` citing a new root `CLAUDE.md` section, "`Module#autoload` is
a build step". New names the step needs carry
`@noRailsEquivalent PERMANENT` against that section.

### Seating

`Cref` keeps its API (`get`, `set`, `defined?`, `remove`). It operates on plain
property seats, not a table: `cref.set(v)` is `mod[cname] = v` plus the
classpath write `const_set` does, as RFC 0205 prescribes for a seat.

`Object`, the root namespace, needs a home `@blazetrails/zeitwerk` can reach.
Zeitwerk does not depend on ActiveSupport, so `TopLevel` moves from
`packages/activesupport/src/namespaces.ts` down to ruby-compat, and activesupport
re-exports it. `TopLevel` is Ruby's `rb_cObject` constant table from then on, and
`RCLASS_CONST_TBL` goes.

After a file's `import()` resolves, `on_file_autoloaded` runs: it reads the named
export, seats it through `cref.set`, removes the `autoloads` entry, adds to
`to_unload`, and runs `on_load`. For a directory, `on_dir_autoloaded` seats a
plain-object module, the first shape in root § "A Ruby module is a JS object or a
JS class". An explicit namespace is seated before its children, which is what
`on_namespace_loaded` does from `const_added`.

**App files still write ES imports.** A Rails file names `ApplicationRecord` with
no `require`. A TS file has to import what it names, and `extends` is a
module-eval read. This RFC leaves that alone: a file's imports are its own, and
the loader adds a name → class route alongside them, not instead of them. So a
superclass cycle between app files fails the way any ESM cycle fails. The
`constantize` route, a `class_name:` string for example, keeps working in a cycle
because it is a call-time read.

### Loading: everything at boot

`setup_main_autoloader` is followed by an awaited
`Rails.autoloaders.main.eager_load()`, **whatever `config.eager_load` says**, and
`setup_once_autoloader` does the same for `once`. Lookup is synchronous, so a
constant must be seated before the first lookup, and nothing can load it at
that moment.

`config.eager_load` keeps its Rails meaning for the rest of the `eager_load!`
initializer (`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:76-90`):
`before_eager_load`, `Rails.eager_load!`, `eager_load_namespaces`. A
`do_not_eager_load` path is not loaded. Reading one of its constants raises
`NameError` until `await loader.load_file(path)` runs, which is the one
observable difference from Ruby.

### Reload

`reload` is async, and Rails' awaits it. Its structure is Zeitwerk's: `unload`,
`recompute_ignored_paths`, `recompute_collapse_dirs`, `setup`. Then the Rails
reloader's `after_class_unload` eager loads, unconditionally for the reason above.

**Reload drops every reloadable constant, not only the changed ones.** The
direction for this RFC said "unload changed constants". Zeitwerk's `unload`
walks all of `to_unload`, and that is the sound behaviour too: an unchanged
`Post` holds the old `ApplicationRecord` in its prototype chain, the old
`Comment` in its closures and the old classes in `DescendantsTracker`. Reloading
one file gives two live generations of a class, and identity checks fail. The
file → constant map is what `unload` walks, and the file watcher decides _when_
to reload, as `ActiveSupport::Reloader` does. See open question 1.

Each `reload` is one **generation** `N`. Every file is re-imported under
`?zeitwerk=N`, the `rbFLoad` shape. That alone is not enough, and this is the
hardest part of the RFC: a fresh `post.ts?zeitwerk=2` that says
`import { ApplicationRecord } from "./application-record.js"` resolves without
the query, and binds the old module. So in development a synchronous Node
resolve hook (`module.registerHooks`, Node ≥ 24 is the repo's engine floor)
appends the importer's generation to any specifier that resolves to a managed
file. Framework packages and `once` files stay in the first generation. This
exists only in development. It is untested, and
`zeitwerk-reload-generation-spike` is a go/no-go on it; see open question 2.

**Vitest cannot exercise this.** The suites run through Vite's resolver, not
Node's, so the hook never fires there. Reload tests that assert generations, in
the gem and in railties, spawn a real `node` subprocess against a temporary
directory, as `scripts/test-deps/` does. Every other loader test runs under vitest,
because `eager_load` uses `import()` with a file URL and needs no hook. The spike
also settles `registerHooks`' stability level on Node 24; the repo's `engines`
floor is `>=24`.

**Module records are never evicted.** ESM has no unload, so each generation keeps
its records for the life of the process, where Ruby's unloaded classes are
collected. The bound is `managed files × reloads`, the same trade root
§ "Templates are precompiled" accepts. It is development only, since
`enable_reloading` is off in production, and it ends at process restart. Nothing
is added to mitigate it.

### `constantize`, `safe_constantize`, `const_get` restored

**Today** `constantize` (`packages/activesupport/src/inflector.ts:194`) is already
a segment walk with a `constMissing` arm. It reads `RCLASS_CONST_TBL` by full
path first, then a property on the receiver, then the name → class map behind
`generatedClass`. A miss with no hook raises `NameError`. So the port exists, over
tables Rails does not have, and "restored" means restored as permitted and
rewired, not newly written. `constantize-restored-over-namespaces` is a rewrite of
that reader plus its types, which is what its 400 lines cover.

After it, these are ports reading the namespaces:

- `constantize` is `Object.const_get(camel_cased_word)`, walking `TopLevel` by
  segment. A miss calls the receiver's `constMissing`.
- `safeConstantize` keeps its `NameError` filter (it already matches Rails').
- `rbModConstGet`, `rbModConstDefined`, `rbModConstants` and `rbPathToClass` stay
  public, and § "Constant lookup is an import or a registry" no longer forbids
  them. **A literal name that a plain import can reach is still an import**
  (§ "Call-time constant resolution" is unchanged on that). Lookup is for a name
  Rails computes, or one that application data supplies.

**The miss hook.** `const_missing` is the `constMissing` static that `constantize`
already dispatches to, and `rbConstMissing`'s Proxy where a property read must
reach it. Default behaviour raises `NameError: uninitialized constant …`.
Zeitwerk defines no `const_missing`, so the hook is not a lazy-load seat.

`computeType` already reads `constantize` / `safeConstantize` on main, because
trails#9466 has not merged, and is a line-for-line port. So the three reflection tests
are **not skipped on main today**. The acceptance criterion is that they stay
running and pass once the `TopLevel` walk and the retired `registerX`
are in place.

### Railties

Port `Rails::Autoloaders` as `Trails.autoloaders`, with `main` and `once`, tags
`rails.main` and `rails.once`, the existing `autoloaders/inflector.ts`,
`Enumerable`, `logger=`, `log!`, `zeitwerk_enabled?`
(`vendor/rails/v8.0.2/railties/lib/rails/autoloaders.rb`). Then, at Rails names:

- `setup_once_autoloader`
  (`vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb:92-109`) and
  `setup_main_autoloader` (`application/finisher.rb:17-45`), today a named
  initializer with no loader behind it;
- `config.autoload_paths`, `eager_load_paths`, `autoload_once_paths` feed
  `ActiveSupport::Dependencies.autoload_paths` / `autoload_once_paths` /
  `_eager_load_paths` through `set_autoload_paths` and `set_eager_load_paths`
  (`engine.rb:578-589`);
- `autoload_lib` / `autoload_lib_once` hand `ignore` to the loader
  (`application/configuration.rb:471-493`), and `trails new` emits the
  `autoload_lib` line;
- `Engine#eager_load!` (`engine.rb:490`), `_autoloaded_tracked_classes`, and
  `after_class_unload`'s eager load (`finisher.rb:83-87`).

The finisher's three `@missingRailsCall … PERMANENT` receipts come off.
`loadAppClasses`, `collectAppClasses`, `collectModels` and `loadControllers` are
deleted. `defineController`'s `Helpers.inherited` call moves to an `on_load` for
controllers.

**File layout becomes a contract.** The old scan took any exported
subclass under any file name. A file now has to define the constant its path
says. A generated app already does; an existing app with two classes in a file
or a default export gets the Zeitwerk error at boot. trails has no published
apps to migrate beyond the repo's own fixtures, which `trailties-app-scan-retires`
sweeps.

### `registerX` retires

`registerModel`, `registerController`, `registerJob`, `registerChannel` and
`registerConnection` retire. Their read of a name is `constantize`, and their
write is the loader's seat.

They do a second job in tests and in code outside any loader. In Ruby the `class`
keyword binds the constant wherever the class is written. In JS only a loader or
an explicit seat binds one. A class defined in a test body, or in a file no
loader manages, is therefore seated with `rbModConstSet(TopLevel, "Post", Post)`,
the port of the keyword's own `rb_const_set`. That is a change to RFC 0205's rule
that `rbModConstSet` is written only where Rails says `const_set`, and it is
recorded there. Canonical models in `test-helpers/models/` are required in Rails
and stay imports, each file seating its own class; no test loader is added.

`ArgumentError` on a base mismatch has no Rails counterpart and goes. The
remaining `inherited`-shaped effects of `registerModel`, if any survive audit,
belong to own-property memo guards (root § "`inherited` is deferred").

### Framework constants

**This is a separate mechanism.** Rails' framework gems use `require` and
`Module#autoload` (`ActiveSupport::Autoload`), not Zeitwerk, so no `Loader`
manages them and none will. They share two things with the application side: the
inflector and the walk over a file tree, at build time.

`pnpm parity:class-paths` today derives `class-paths.generated.ts` from
`rails-api.json`, which needs `vendor/rails` and a parity run. Replace it with a
generator built on the loader's `cname_for` plus a `GemInflector`:

- A file's directory gives the namespace, as `cpath_expected_at` would, and its
  exported classes give the `cname`s. `RUBY_FILE_TS_OVERRIDES` and
  `PATH_SEGMENT_ALIASES` become that inflector's overrides and `collapse` entries.
- `constants.generated.ts`, one per package, replaces
  `class-paths*.generated.ts`. It writes both directions from one row: class →
  path (`rbModName`) and path → class (`const_get`).
- `parity:class-paths --check` stays, as the cross-check against `rails-api.json`
  and against seated paths, so a generator miss is a red and not a silent drift.
- **Not every framework constant is path-derivable.** Reopened modules and
  several classes in one file (`arel/nodes/binary.rb`) put a class somewhere its
  path does not say. The first framework story reproduces the existing tables and
  counts the residue, which becomes override rows. If the residue is large, those
  rows keep their manifest source (open question 3).

`registerConstant`, `registerClassPaths`, `generatedClass`, `generatedClassPath`
and `RCLASS_CONST_TBL` are then deleted. `rbModName`'s reader moves to the new
table, and the rule that class → name is a ruby-compat internal stands.

**Constraints that do not change:**

- **Module-eval reads and the Autoload namespaces.** RFC 0151's namespace objects
  stay: `include(Base, ActiveRecord.Scoping)` still needs a seat read during
  evaluation, and the generated table cannot supply it, because it is imported
  last by the package entry. It is a call-time source only. The namespaces and
  `TopLevel` agree because a namespace's own seat is found first on the walk.
- **TDZ and cycles.** Rows are thunks, resolved on first lookup, as
  `registerClassPaths`' are, so the table adds no module-eval read. The entry
  check stays: a plain-node import of built `dist/**.js` as entry modules, in both
  directions. A table imports every module it names, so a deep import that skips
  the entry skips the table, which is today's
  `class-paths-resolve-for-entry-less-deep-imports`.
- **Application namespaces reach framework ones through `TopLevel`** seated by each
  package entry (`TopLevel.ActiveRecord = ActiveRecord`), which is today's seat.

## `CLAUDE.md` sections to rewrite

Each rewrite lands with the story that makes it true; § "Rollout" names the owner.
The decision-history entry lands first, with `vendor-zeitwerk-v2-7-2`.

| File                                                          | Section                                                                 | Change                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| root                                                          | "Constant lookup is an import or a registry"                            | Reversed: lookup is real, reads namespaces, imports still preferred for known names |
| root                                                          | "Call-time constant resolution"                                         | `registerConstant` and class-path text; `TopLevel` lives in ruby-compat             |
| root                                                          | "Trails has no autoloader" (pointer)                                    | Renamed, one-line rule replaced                                                     |
| root                                                          | new: "`Module#autoload` is a build step"                                | The one ratified deviation                                                          |
| root                                                          | "A migration file is loaded by `Kernel#load`" (pointer)                 | `rbFLoad` seats onto `TopLevel`                                                     |
| `packages/trailties/CLAUDE.md`                                | "Trails has no autoloader"                                              | Replaced by the loader, its boot order, its file contract                           |
| `packages/activerecord/CLAUDE.md`                             | "A model is seated by `registerModel`", "Call-time constant resolution" | Seat by loader or `rbModConstSet`; inventory updated                                |
| `packages/activesupport/CLAUDE.md`, `packages/arel/CLAUDE.md` | "Call-time constant resolution"                                         | Inventory updated                                                                   |
| `docs/claude-md-decision-history.md`                          | new entry                                                               | Both reversals, with their dates and reasons                                        |

## Other RFCs

- **RFC 0212** lists `autoloaders.rb`, `autoloaders/**` and `zeitwerk_checker.rb`
  as ruled out, and **RFC 0177** lists Zeitwerk as not ported. Each carries a note
  added here that this RFC reverses that when it goes `active`.
  `zeitwerk_checker.rb` then falls to `trailties-autoloaders-and-config-paths`.
  Rewriting 0212's permanent unported rows is that story's work too.
- **RFC 0142** is the trailties deviation bucket. Its stories that rest on the
  scan or the class-path tables, such as
  `trailties-subpath-exports-load-their-class-path-table`, are re-read when
  `trailties-app-scan-retires` and `framework-constant-tables-replace-class-paths`
  land, and closed or rewritten then. No story moves now.

## RFC 0205

RFC 0205's seat and read arm is unaffected: plain imports inside bodies, plain
assignment seats and the module-eval survivors all stand. Its lookup arm is
replaced. Its README records the disposition story by story in § "Lookup arm: proposed supersession".

## trails#9466

**Superseded, with one piece adopted.** It stays held and closes unmerged once
this RFC is approved. `registeredModel` and its siblings are the reverse of this
design, and its three `it.skip`s are avoided by not merging it. The adopted piece
is its finding that HABTM join models, which Rails `const_set`s
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations.rb:1877`), must
be reachable under their qualified name. That goes into
`constantize-restored-over-namespaces` as a test, seated by the port's existing
`const_set` site.

## Non-goals

- **Lazy `import()` loading.** A constant cannot be loaded at its first
  reference, because the reference is synchronous. Making it possible means
  making `constantize`, `compute_type`, `reflection.klass` and everything reading
  them async, at the same prominent surfaces root § "A translation lookup is
  synchronous" refused to make async. Lazy loading per request would also turn a
  sync read into a read that sometimes fails depending on what ran first.
- **Bare-name references in app code.** No global injection of constants. A file
  imports what it names.
- **Porting `Zeitwerk::Loader.for_gem`'s use in trails packages.** The port
  exists for fidelity (`GemLoader`, tests), but framework packages stay ES modules.
- **Thread-safety machinery.** `mutex` and `dirs_autoload_monitor` guard threads.
  Where a section spans an `await`, root § "The pool monitor guards only sections
  that span an `await`" decides, not this RFC.

## Alternatives considered

- **Keep `registerX` as it is (#9466).** Smallest diff, and it leaves three tests
  parked permanently, every Rails `const_get` body deviating, and a new
  `registerX` per app directory. Rejected by this direction.
- **Runtime fs scan at boot, no build step.** The 2026-10-27 ruling in RFC 0205
  and the current finisher. Rejected as the _only_ source for three reasons: it
  cannot run in a bundle or without a file system, it produces no types, and it
  keeps a bespoke name table. The objections recorded on 2026-10-28 were about
  name → class lookup routed through parity-generated tables and the edge cases of
  a class learning its name; here the walk is Zeitwerk's and a path comes from the
  loader, so those do not recur. The ported walk does run in process in
  development and test (see above), as a caller of the same code.
- **Lazy `import()`.** See non-goals.
- **A bespoke manifest with no Zeitwerk port.** Cheaper at first. It would
  re-derive the expected-constant contract, collapse, ignore, namespaces and
  collisions as invented surface, without Zeitwerk's test suite to hold it, and it
  fails the "would a Rails dev recognise this" bar. Rails developers know
  `Rails.autoloaders.main.collapse`.
- **Keep `registerModel` in tests only.** A two-spelling world, with app and test
  code seating differently. See open question 4.

## Rollout

Not yet filed; `tasks new` follows approval. `max-est-loc` is lifted to 2500 for
one story only, `register-x-retires-from-activerecord-tests`, a single mechanical
rename. Every other story stays under 700.

Order matters, because the lookup restore must not break a working `constantize`.
At each phase main stays green and the old path works until its replacement lands.

**Phase 1, gem.** Nothing in trails uses it yet; Zeitwerk's tests run against the
package. `@blazetrails/zeitwerk` seats the root namespace on `TopLevel`, so
`top-level-moves-to-ruby-compat` comes before the `Cref` work.

| Story                                     | Cluster   | est-loc | Deps                                                                        | Scope                                                                                                                 |
| ----------------------------------------- | --------- | ------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `vendor-zeitwerk-v2-7-2`                  | zw-gem    | 60      |                                                                             | `sources.ts`, lock, `vendor/README.md` row; `docs/claude-md-decision-history.md` entry for both reversals             |
| `zeitwerk-package-skeleton-and-inflector` | zw-gem    | 300     | `vendor-zeitwerk-v2-7-2`                                                    | Package registrations, parity enrollment, inflectors, errors, their tests                                             |
| `top-level-moves-to-ruby-compat`          | zw-lookup | 250     |                                                                             | `TopLevel` down, `RCLASS_CONST_TBL` readers onto it                                                                   |
| `zeitwerk-loader-config-and-helpers`      | zw-gem    | 550     | `zeitwerk-package-skeleton-and-inflector`, `top-level-moves-to-ruby-compat` | `loader/config.rb`, `helpers.rb`, `Cref`, `Cref::Map`, `Registry`; ignore, collapse, push_dir tests                   |
| `zeitwerk-setup-walk`                     | zw-gem    | 450     | `zeitwerk-loader-config-and-helpers`                                        | The walk, in process, filling `autoloads` and `namespace_dirs`                                                        |
| `zeitwerk-eager-load-and-callbacks`       | zw-gem    | 650     | `zeitwerk-setup-walk`                                                       | `eager_load*`, `load_file`, `callbacks.rb`, seating, `on_load`, namespaces                                            |
| `zeitwerk-build-artifacts`                | zw-gem    | 400     | `zeitwerk-setup-walk`                                                       | Manifest, `imports.generated.js`, `constants.generated.d.ts`, digest, `trails-tsc` subcommand, root deviation section |
| `zeitwerk-reload-generation-spike`        | zw-gem    | 100     | `zeitwerk-eager-load-and-callbacks`                                         | Go/no-go on open question 2, run under real Node                                                                      |
| `zeitwerk-reload-and-unload`              | zw-gem    | 500     | `zeitwerk-reload-generation-spike`                                          | `unload`, `reload`, `on_unload`, `to_unload`                                                                          |
| `zeitwerk-remaining-test-suite`           | zw-gem    | 700     | `zeitwerk-reload-and-unload`                                                | The rest of `test/`; Ruby-only arms under `PERMANENT-SKIP:`                                                           |

**Phase 2, railties.** `Trails.autoloaders` replaces the scan. `registerX` is still
called, from an `on_load` that `trailties-autoloaders-and-config-paths` adds, so
`registerConstant` keeps seating application classes on `TopLevel`.

| Story                                    | Cluster     | est-loc | Deps                                                                   | Scope                                                                                                |
| ---------------------------------------- | ----------- | ------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `trailties-autoloaders-and-config-paths` | zw-railties | 500     | `zeitwerk-eager-load-and-callbacks`                                    | `Trails.autoloaders`, both setup initializers, path config, `autoload_lib`, the `on_load` above      |
| `trailties-app-scan-retires`             | zw-railties | 350     | `trailties-autoloaders-and-config-paths`                               | Scan deleted, file contract enforced, app fixtures swept, trailties `CLAUDE.md` and its root pointer |
| `trailties-reload-drives-zeitwerk`       | zw-railties | 300     | `zeitwerk-reload-and-unload`, `trailties-autoloaders-and-config-paths` | Reloader, `after_class_unload`, tracked classes                                                      |

**Phase 3, lookup.** This does not depend on Phase 2 and may land before it.
`registerX` writes through `registerConstant` today
(`packages/activerecord/src/associations.ts:112`,
`packages/actionpack/src/action-controller/base.ts:779`,
`packages/activejob/src/base.ts:167`), and `top-level-moves-to-ruby-compat` makes
`registerConstant` write `TopLevel`. So the walk finds application classes
whichever path seated them.

| Story                                  | Cluster   | est-loc | Deps                             | Scope                                                                                                                                                        |
| -------------------------------------- | --------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `constantize-restored-over-namespaces` | zw-lookup | 400     | `top-level-moves-to-ruby-compat` | Walk `TopLevel`, typed `ConstantTable`, `rbFLoad` seat, the 3 reflection tests stay green, HABTM test; root lookup and call-time sections, `rbFLoad` pointer |

**Phase 4, retire `registerX`.**

| Story                                        | Cluster   | est-loc | Deps                                                                 | Scope                                                                                             |
| -------------------------------------------- | --------- | ------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `register-x-retires-from-source`             | zw-lookup | 450     | `constantize-restored-over-namespaces`, `trailties-app-scan-retires` | Source callers and the `on_load`; definitions stay until the tests move; activerecord `CLAUDE.md` |
| `register-x-retires-from-activerecord-tests` | zw-lookup | 2200    | `register-x-retires-from-source`                                     | Single mechanical rename onto `rbModConstSet`                                                     |
| `register-x-retires-from-other-tests`        | zw-lookup | 300     | `register-x-retires-from-source`                                     | The other packages' tests, then the definitions                                                   |

**Phase 5, framework tables.**

| Story                                           | Cluster      | est-loc | Deps                                                                                                                                 | Scope                                                                                        |
| ----------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `framework-constant-table-generator`            | zw-framework | 500     | `zeitwerk-loader-config-and-helpers`                                                                                                 | Generator over `GemInflector`, residue counted, `--check` kept                               |
| `framework-constant-tables-replace-class-paths` | zw-framework | 600     | `framework-constant-table-generator`, `constantize-restored-over-namespaces`                                                         | The 35 tables to `constants.generated.ts`, new readers                                       |
| `delete-register-constant-and-class-path-api`   | zw-framework | 350     | `framework-constant-tables-replace-class-paths`, `register-x-retires-from-activerecord-tests`, `register-x-retires-from-other-tests` | Deletions, ruby-compat internals, entry-module TDZ check; activesupport and arel inventories |

Total: about 9,900, of which 2,200 is the mechanical rename.

## Risks

- **Reload under ESM.** The generation hook is unproven, and a missed edge means
  old and new classes coexisting. The spike is a separate go/no-go; a failure reopens the
  reload design only, since boot does not need it.
- **Build-step requirement for tests.** Handled by the in-process walk: vitest and
  Zeitwerk's own `with_files`-style tests call `setup` with no artifact, no
  globalSetup and no checked-in manifest. The only test that needs an artifact is
  the one proving a built manifest boots with no file system. A test that needs a
  class named reads a seat, as the `rbModConstSet` rule says.
- **Bundle size.** `imports.generated.js` makes every app file reachable, which an
  eager boot already requires. `constants.generated.ts` imports what
  `class-paths.generated.ts` imports today, so tree-shaking is no worse, and no
  better. A subpath that stays out of the entry keeps its own table
  (`class-paths.excluded.generated.ts`'s job). Lookup bars tree-shaking of any
  class that a string can name, which is inherent.
- **Generated-file churn.** App artifacts live in `.trails/`, gitignored, and need
  no review. `constants.generated.ts` is checked in, as class-paths are, so a new
  class touches one generated file, same as today. The manifest digest makes a
  stale artifact a loud boot error.
- **Boot cost in development.** Every managed file is imported at boot, where Rails
  would be lazy. The existing scan already imports them, so this does not regress.
- **Build boots the app.** An initializer that needs a database at build time fails
  the build. Rails has `assets:precompile`'s version of this. Initializers get the
  same "don't touch reloadable code" discipline, and the build stops before
  `eager_load`.
- **Package name collision.** `Zeitwerk::NameError` subclasses `::NameError`, so it
  must extend ruby-compat's, which `safeConstantize`'s filter already handles.
- **Reversal churn.** Ready stories under RFC 0205 could convert `constantize`
  sites to imports while this is under review. Approval should freeze them first.

## Verification

- `pnpm parity:api` for `zeitwerk`: all of `lib/zeitwerk/` matched, apart from the
  scoped skips.
- `pnpm parity:test` for `zeitwerk`: every portable test of the ~443 matched, the
  rest under a `PERMANENT-SKIP:` citing the deviation section.
- The 3 reflection tests run and pass; none is skipped.
- Zero source references to `registerModel`, `registerController`, `registerJob`,
  `registerChannel`, `registerConnection`, `registerConstant`,
  `registerClassPaths`, `generatedClass`.
- The finisher has no `@missingRailsCall` for `eager_load_all`, `eager_load!` or
  `after_class_unload`.
- A fixture app under `packages/trailties`, built by the `zeitwerk-build-artifacts`
  subcommand, boots in a `node` subprocess from its artifacts with no scan and no
  `vendor/`, and answers `constantize` for a namespaced controller.
- In a subprocess, a changed file reloads with no class surviving from the
  previous generation (`zeitwerk-reload-and-unload`).
- `pnpm parity:modules` and the plain-node entry import pass for every package.

## Open questions

1. **Reload scope.** The direction said "unload changed constants"; this RFC
   drops all of them, as Zeitwerk does. Recommendation: whole-loader, for the
   soundness reason in § "Reload". A narrower reload would be a second deviation.
   Needs the owner's confirmation.
2. **Generation propagation.** A resolve hook is the recommendation. The fallback,
   rewriting specifiers in a dev transform, is uglier. Settled by `zeitwerk-reload-generation-spike`.
3. **Framework residue.** How many table rows the path cannot derive. If it
   is more than a small override list, those rows keep a `rails-api.json` source.
   Settled by `framework-constant-table-generator`.
4. **Test seats.** `rbModConstSet(TopLevel, "Post", Post)` at about 2,000 sites, or
   a short helper. Recommendation: no helper, since it would be invented surface
   and the call is a real port of `rb_const_set`.
5. **`constants.generated.d.ts` for framework cpaths.** App-only is the
   recommendation, with framework literals being imports anyway.

## Changelog

- 2026-10-30: initial RFC.
