---
rfc: "0000-thor-port"
title: "Thor: a direct port of thor 1.3.2, and trailties' generators and commands converged onto it"
status: draft
created: 2026-09-30
updated: 2026-09-30
owner: "@deanmarano"
packages:
  - trailties
  - ruby-compat
  # move-db-commands-onto-databases-rake-tasks-part-{1,2} port activerecord's databases.rake.
  - activerecord
clusters:
  - fidelity
related-rfcs:
  - "0142-trailties-surfaced-deviations"
  - "0149-bare-keyed-option-hashes"
priority: 2
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Thor

## Summary

railties is built on Thor. `Rails::Command::Base < Thor`
(`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:14`), `Rails::Generators::Base <
Thor::Group` with `include Thor::Actions` (`railties/lib/rails/generators/base.rb:17-18`), and
every generator body is Thor DSL. Across `vendor/rails/v8.0.2/railties/lib` there are about 115
`class_option`, 74 `desc`, 106 `template`, 73 `say`, 64 `options.x?`, 49 `empty_directory`, 45
`namespace`, 41 `remove_file`/`remove_dir`, 35 `inside`, 29 `invoke`, 29 `argument`, 27
`hook_for` and 23 `directory` call sites.

trailties re-invents Thor piecemeal: `packages/trailties/src/generators/base.ts` (991 lines:
`classOption`/`classOptions`, `commands()`, `invocations`, `invoke*`, `sayStatus`,
`createFile`, `emptyDirectory`, and a hand-written switch parser in `dispatch`), a second
`classOption` copy in `packages/trailties/src/command/base.ts`, and **commander** standing in for
`Thor::Options` and `Thor.dispatch` in `cli.ts`, `command.ts` and 14 `commands/*.ts` files.
trails#8269 vendored thor v1.3.2 (`vendor/thor/v1.3.2`, the version railties 8.0.2 resolves:
`vendor/rails/Gemfile.lock:630`, `railties.gemspec:45`). It enrolled
`packages/trailties/src/thor/` as an api-compare pseudo-package and ported the source-path half
of `Thor::Actions`. Every other gap so far has surfaced as a one-off deviation story in
`0142-trailties-surfaced-deviations`.

This RFC replaces that drip with one ordered plan. First, make CI for a thor-only diff minimal and
fast (§ "Design" 0). Then port Thor file by file, port its RSpec suite, and converge trailties' generators and commands onto the port, delete the bespoke copies, and
retire commander.

**Size: 81 stories, 31,730 est-loc.** 67 are new, and 14 are existing 0142 stories that this RFC
re-specs and rehomes (§ "Existing stories"). Every story is at most 650 est-loc (the PR ceiling
is 700). The thor spec suite has 868 cases; 791 are portable, and each is assigned by name to
exactly one story.

## Motivation

### What Thor is, file by file

`vendor/thor/v1.3.2/lib/thor` is 6,158 lines in 36 files (3,563 without comments and blank
lines). Where each file goes:

| Thor file                                                                                           | code lines | story                                                                                                |
| --------------------------------------------------------------------------------------------------- | ---------: | ---------------------------------------------------------------------------------------------------- |
| `thor/error.rb`, `nested_context.rb`, `version.rb`                                                  |         99 | `port-thor-errors-nested-context-and-version`                                                        |
| `thor/parser/argument.rb`, `arguments.rb`                                                           |        193 | `port-thor-argument-and-arguments`                                                                   |
| `thor/parser/option.rb`                                                                             |        125 | `port-thor-option`                                                                                   |
| `thor/parser/options.rb`                                                                            |        235 | `port-thor-options-parser`                                                                           |
| `thor/core_ext/hash_with_indifferent_access.rb`                                                     |         75 | `port-thor-core-ext-hash-with-indifferent-access`                                                    |
| `thor/command.rb`                                                                                   |        115 | `port-thor-command`                                                                                  |
| `thor/base.rb`                                                                                      |        371 | `port-thor-base-options-and-arguments-dsl`, `port-thor-base-command-registry-method-added-and-start` |
| `thor/util.rb`                                                                                      |        135 | `port-thor-util` (Runner members: scoped skips)                                                      |
| `thor.rb`                                                                                           |        360 | `port-thor-class-dsl`, `port-thor-dispatch-and-help`                                                 |
| `thor/invocation.rb`                                                                                |         78 | `port-thor-invocation`                                                                               |
| `thor/group.rb`                                                                                     |        172 | `port-thor-group`                                                                                    |
| `thor/shell.rb`, `shell/basic.rb` (output), `shell/terminal.rb`                                     |       ~200 | `port-thor-shell-module-basic-output-and-terminal`                                                   |
| `thor/shell/column_printer.rb`, `table_printer.rb`, `wrapped_printer.rb`                            |        150 | `port-thor-shell-printers`                                                                           |
| `thor/shell/color.rb`                                                                               |         50 | `port-thor-shell-color`                                                                              |
| `thor/line_editor.rb`, `line_editor/basic.rb`, `shell/basic.rb` (ask)                               |       ~110 | `port-thor-line-editor-and-ask`                                                                      |
| `thor/shell/basic.rb` (file_collision, diff, merge)                                                 |        ~60 | `thor-create-file-conflict-has-no-file-collision-prompt`                                             |
| `thor/actions.rb`                                                                                   |        190 | `port-thor-actions-module` (+ `port-thor-actions-apply`; source paths: trails#8269)                  |
| `thor/actions/empty_directory.rb`, `create_file.rb`, `create_link.rb`                               |        160 | `port-thor-empty-directory-create-file-and-create-link`                                              |
| `thor/actions/file_manipulation.rb` (copy / link / get / template)                                  |        ~75 | `thor-actions-template-is-unported`                                                                  |
| `thor/actions/file_manipulation.rb` (edits)                                                         |        ~65 | `port-thor-file-manipulation-edits`                                                                  |
| `thor/actions/directory.rb`                                                                         |         53 | `port-thor-directory-action`                                                                         |
| `thor/actions/inject_into_file.rb`                                                                  |         89 | `port-thor-inject-into-file`                                                                         |
| `thor/runner.rb`, `rake_compat.rb`, `shell/html.rb`, `shell/lcs_diff.rb`, `line_editor/readline.rb` |        425 | **not ported** (§ "Non-goals")                                                                       |

### What the specs cover

The existing extractor already reads RSpec (rack-test is scored that way). Run over
`vendor/thor/v1.3.2/spec`, it reports **868 cases in 36 files**. 77 are not portable: eight
whole files (`runner_spec.rb` 33, `rake_compat_spec.rb` 8, `shell/html_spec.rb` 6,
`line_editor/readline_spec.rb` 7, `quality_spec.rb` 2, `no_warnings_spec.rb` 2,
`encoding_spec.rb` 3, `script_exit_status_spec.rb` 2) plus 14 single cases (10 Runner-only
`util_spec.rb` cases, 2 `base_spec.rb` `#subclass_files`, 1 Readline-selection case in
`line_editor_spec.rb`, 1 `diff-lcs` case in `shell/color_spec.rb`). **791 cases are portable**,
and every story that ports specs lists its cases by name. `enroll-thor-specs-in-parity-test` does
the enrollment: parity:test has no nested pseudo-package today, so that part is tooling.

### What the convergence covers

| trailties today                                                                                  | Rails / Thor                                                                        | stories                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generators/base.ts` dispatch / invoke / invocations / hook plumbing / `say*`                    | `Thor::Group`, `Thor::Invocation`, `Thor::Shell`                                    | `rebase-generator-base-onto-thor-group`, `generator-invoke-for-class-method-with-padding`                                                                                                                                                             |
| `generators/base.ts` constructor + inline switch parser, `run(name, attributes)`                 | `Thor::Base#initialize`, `argument`                                                 | `generator-base-thor-initialize-arguments-and-options-parse`                                                                                                                                                                                          |
| `generators/base.ts` `createFile` / `emptyDirectory` / `appendToFile` / … (sync)                 | `Thor::Actions`                                                                     | `converge-generator-base-file-actions-onto-thor-actions`                                                                                                                                                                                              |
| `generators/named-base.ts`, `generators/actions/create-migration.ts`                             | `NamedBase` (`argument :name`, `template` override), `CreateMigration < CreateFile` | `converge-named-base-onto-thor-argument-and-template-override`, `converge-create-migration-onto-thor-create-file`                                                                                                                                     |
| `generators/actions.ts`, `generators/trails-actions.ts` (`spawnSync`)                            | `Rails::Generators::Actions` over Thor's `run` / `in_root` / `inject_into_file`     | `converge-rails-generators-actions-onto-thor-actions`, `action-methods-inside-chmod-shebang-delegates-unported`                                                                                                                                       |
| 26 generator classes, each one `run(...)` (plus `NamedBase`, `AppBase`, `Tse::Generators::Base`) | one public method per step, `hook_for` interleaved                                  | `split-*` (4), `generators-run-hooks-after-run-not-in-declaration-order`, `trails-new-reaches-app-generator-start`, `generator-dispatch-help-mappings-arm`                                                                                            |
| `command/base.ts` `classOption` / `dispatch` / `help` / `say`                                    | `Rails::Command::Base < Thor`                                                       | `vendor-thor-and-port-command-base-thor-surface`, `port-rails-command-base-usage-and-banner`                                                                                                                                                          |
| `command.ts` `findByNamespace` / `invoke` / `invokeRake` over `createProgram()`                  | `Rails::Command.invoke`, `find_by_namespace`, `RakeCommand`                         | `find-by-namespace-lookup-loads-only-candidates`, `port-rails-command-rake-command`                                                                                                                                                                   |
| 14 commander `commands/*.ts`                                                                     | `rails/commands/*/*_command.rb`, `databases.rake`, `framework.rake`                 | `port-*-onto-rails-command-base` (6), `move-db-commands-onto-databases-rake-tasks-part-1/2`, `move-app-template-command-onto-framework-rake-task`, `port-application-command-and-argv-scrubber`, `port-help-and-version-commands-for-split-namespace` |
| `cli.ts` `createProgram()`, `bin.ts`, `commander` dependency                                     | `rails/cli.rb`, `rails/commands.rb`, `AppLoader`                                    | `trails-cli-has-no-app-loader-exec-app`, `retire-commander-cli-onto-rails-command-invoke`                                                                                                                                                             |

## Design

Each decision below is ratified by a CLAUDE.md section, which the implementing story adds, so
later stories cite it instead of re-deriving it.

### 0. CI first: a thor-only diff runs a minimal lane

Phases 1–5 are about 45 PRs that touch only `packages/trailties/src/thor/**` and the thor rows of
the parity registers. Today each one runs the whole trailties suite, all of Unit Tests, both DX-type
lanes, and a Rails API/Test Comparison job that fetches and extracts every vendored source and runs
about 30 global ratchets. The AR and DB lanes are already skipped. The two
`ci-thor-only-diffs-*` stories come first, and `port-thor-errors-nested-context-and-version`
(the root of the lib chain) depends on them:

- `ci-thor-only-diffs-run-minimal-test-lanes`: a `thor_only` gate, computed by a checked-in
  `scripts/ci/` script because the inline `filter` step is at GitHub's size limit. Under it,
  Trailties Tests becomes `vitest related` over the changed Thor files (Thor tests plus every
  trailties test that imports them, so a break in `generators/base.ts` is still caught), the DX
  lanes skip, and Unit Tests keeps only the tree-scanning guards.
- `ci-thor-only-diffs-scope-rails-comparison-to-thor`: the comparison job fetches, extracts and
  compares the thor source only, and each ratchet runs `--package thor` or stays unscoped with a
  recorded reason. A partial artifact must never make another package's rows read as STALE.

A diff with any non-thor path runs exactly today's matrix, so phases 6–7 get no shortcut.
Alternatives: `paths-ignore` (skips checks the aggregator requires, and cannot run the selected
subset) and a separate thor workflow (duplicates setup and splits the required-check set).

### 1. `method_added` / `desc`: commands register through an explicit `methodAdded`

Thor registers a command whenever the VM fires `method_added` for a public `def`
(`vendor/thor/v1.3.2/lib/thor/base.rb:729-745`). `Thor.create_command`
(`vendor/thor/v1.3.2/lib/thor.rb:560-583`) consumes the pending `@usage` / `@desc` /
`@method_options` that the preceding `desc` / `method_option` calls set, and clears them. In a
`Thor::Group` every public method is a command, in definition order (`group.rb:263-266`), and
`invoke_from_option` defines a command at its declaration point, which is how Rails' `hook_for`
interleaves with a generator's steps.

JS has no hook when a method is defined, and a class's `static {}` blocks run after every
prototype method exists. **Settled shape:** a class body fires the hook itself, where Ruby's
`def` would:

```ts
class MyScript extends Thor {
  static {
    this.desc("zoo", "zoo around");
    this.methodOption("random", { type: "boolean" });
    this.methodAdded("zoo");
    this.desc("animal TYPE", "horse around");
    this.methodAdded("animal");
  }
  zoo() { … }
  animal(type: string) { … }
}
```

`methodAdded` is Thor's own `method_added`, ported line for line, so `create_command`'s pending
state machine, its `[WARNING]` arm, `is_thor_reserved_word?` and `register_klass_file` all run
unchanged. `thor-command-registration-lint-rule` restores the guarantee Ruby gets for free: a
public method of a Thor subclass that is never passed to `methodAdded` is a lint error, and the
autofix inserts the calls in definition order.

Alternatives considered:

- **A prototype walk at first `commands()` read.** It gives Group's definition order for free,
  but the walk cannot pair a pending `desc` with its method (a public method without a `desc`
  is a warning in Thor, not a command), and it cannot place a `hook_for` between two steps.
- **`desc(name, usage, description)`**, naming the command. That changes a Rails-facing arity,
  and `desc for:` already means "amend an existing command".
- **Method decorators** (`@command("install NAME", "…")`). Standard decorators do run per method
  in definition order, but they are invented surface imposed on every Thor subclass,
  including user-written generators. CLAUDE.md's `inherited` section rejects decorators for the
  same reason.

### 2. `no_commands`

Ported verbatim over `NestedContext` (`base.rb:530-542`, `nested_context.rb`). Under decision 1,
a helper is declared the way Ruby declares one, `this.noCommands(() => this.methodAdded("helper"))`
for `no_commands do def helper; end end`. The explicit registration returns early inside the
context, and the lint rule accepts the helper as declared. `argument` and the `attr_*` overrides
(`base.rb:154-164,263`) use the same path. The alternative, treating an unregistered public method
as an implicit non-command, would leave the lint rule unable to tell a forgotten command from a
helper.

### 3. Package home: keep the `trailties/src/thor` pseudo-package

Thor is a separate gem in Ruby, and a `@blazetrails/thor` package would mirror that. It would
cost the new-package registrations: the four subpath registrations, `ci.yml`, the guard fixture,
the lock-worker resolve hook, `vendor/sources.ts` / api-compare / test-compare re-rooting, and
moving the three files #8269 landed. Thor has exactly one consumer (trailties). The
pseudo-package is already enrolled in api-compare (`PACKAGE_DIR_OVERRIDES.thor = "trailties"`,
`PACKAGE_SRC_SUBDIR.thor = "thor"`). **Recommendation: keep it.** The two things a separate
package would enforce are enforced directly:
`enroll-thor-specs-in-parity-test` adds an import-boundary lint (`src/thor/**` imports only
ruby-compat and did-you-mean, never `../` outside `thor/`), and a separate parity:test block.
Splitting later is mechanical if a second consumer appears.

### 4. Async: prompts, file actions and dispatch are async

Thor runs synchronously. In trails, reading a line (`$stdin.gets`), the file actions (the
async `getFs()` adapter the website's in-memory fs needs; trails#8269), and shell-outs
(`system`) are all async. The cascade is:
`LineEditor#readline` → `ask` / `yes?` / `no?` / `file_collision` → `CreateFile#force_on_collision?`
→ `on_conflict_behavior` → `invoke!` → `action` → every `Thor::Actions` method → every command
body → `Command#run` → `invoke_command` / `invoke_all` / `invoke` → `dispatch` → `start`.
`invoke_all` awaits each command in order: Ruby's `all_commands.map { … }` is sequential, and a
`Promise.all` would not be. Block-scoped state (`inside`, `with_padding`, `mute`, `indent`,
`with_output_buffer`, `FileUtils.cd`) restores when the block's promise settles. Constructors
stay synchronous, since `Thor::Base#initialize` does no I/O. `port-thor-invocation` adds the
CLAUDE.md section.

Alternatives considered: keeping the sync `fs` path breaks the website's generators; a
synchronous stdin read blocks the event loop under a running `run` and cannot be served by a
browser adapter; and a sync `invoke_all` that drops promises runs a generator's steps
interleaved.

### 5. The subclass registry (`inherited`)

`Thor::Base.subclasses` is filled from `inherited` and `method_added` (`base.rb:128-150,721-725,744`),
and `Thor::Util.find_by_namespace` / `find_class_and_command_by_namespace` search it.
`inherited` is `tsMirrorIsDrift` (`scripts/parity/conventions.ts:592-595`). Its two effects are
deferred: the `@no_commands` reset becomes the own-property memo guard (CLAUDE.md § "`inherited`
is deferred to own-property memo guards"), and `register_klass_file` runs from `methodAdded`
(which Thor also does) and from an explicit `namespace(name)`. The one observable difference is
that a Thor subclass with no command and no explicit namespace is absent from `subclasses`. It
is recorded at `subclasses`. `namespace` derives from the class's Ruby constant name, which
classes carry the way trailties' railties already do
(`generator-base-name-derived-from-bare-js-class-name`).

### 6. Option names and the options hash

`class_option :skip_git` is `classOption("skipGit")`, and its value is read as
`this.options.skipGit` (RFC 0149: a Ruby Symbol name is its camelCase spelling in trails,
and today's generators already use it). The switch the user types is still `--skip-git`:
`Thor::Option#dasherize` is where a Symbol name becomes CLI text, and it converts camelCase to
kebab-case there, once. Parsing is keyed by `switch_name` (`options.rb:52-58`) and assigns to
`human_name`, so no other method changes. The parse result is the frozen
`Thor::CoreExt::HashWithIndifferentAccess`. Its `method_missing` predicate arm, which railties
calls 64 times as `options.skip_git?`, is a `Proxy` answering `options.isSkipGit` with Ruby
truthiness. That is a new row in CLAUDE.md's method_missing table.

Alternatives considered: snake_case option names (`options["skip_git"]`) contradict RFC 0149 and
every existing generator. Writing `options.skipGit` for `options.skip_git?` loses Ruby
truthiness, because `""` would be false. activesupport's HWIA is a different class with a
different surface.

### 7. `apply`: a template is a module

`Thor::Actions#apply` `instance_eval`s a Ruby template file against the generator
(`actions.rb:216-233`). trailties' `app:template` already imports a JS module and calls its
default export with the generator (`packages/trailties/src/commands/app.ts`). `apply` keeps Thor's
body (source-path lookup, URI fetch, `say_status :apply`, padding) and replaces only the
evaluation, with `(await import(url)).default.call(this, this)`.

### 8. `template`: ERB is TSE, and the template's `self` is the generator

`template` renders with `CapturableERB` against `instance_eval("binding")`
(`file_manipulation.rb:117-132,362-369`). The trails renderer is TSE, the ERB port. A compiled
template is called with `this` bound to the generator (or `config.context`), and
`@output_buffer` is the generator's private output buffer, so `capture` / `concat` work inside
templates. Fixture and generator `.tt` bodies become TSE over JS expressions.

### 9. Call arity

`Command#run` rescues the VM's `ArgumentError` to print usage (`command.rb:21-38,114-119`). JS
never checks arity, so `ruby-compat-check-arity-raises-argument-error` raises Ruby's message
from the function's parameter list (the same parse as `Method#arity`), and `run` calls it
before the send.

### 10. `inside` changes the process directory, as in Ruby

`FileUtils.cd` with a block is process-global in Ruby too. trails keeps that scope (no invented
per-context cwd) and only makes the restore wait for the block's promise to settle
(`ruby-compat-fileutils-cd-block-restores-on-settle`).

## Non-goals

- **`Thor::Runner`** (`runner.rb`, the `thor` executable that installs and runs Thorfiles) and the
  util members that exist only for it (`namespaces_in_content`, `load_thorfile`, `user_home`,
  `thor_root`, `thor_root_glob`, `globs_for`, `Sandbox`, `subclass_files`). railties never
  reaches them.
- **`Thor::RakeCompat`**: Rake-task-to-Thor bridging. railties does not use it.
- **`Thor::Shell::HTML`** and `Util.escape_html`: no terminal.
- **`Thor::LineEditor::Readline`** (completion and history). `Basic` covers every railties
  prompt, and `LineEditor.best_available` answers `Basic`.
- **`LCSDiff`**: needs the `diff-lcs` gem, which is not vendored. `Color#show_diff` falls back to
  `Basic#show_diff` (`diff -u`), exactly as Thor does when the gem is absent.
- The one-argument `options.x?(value)` compare arm: railties never calls it.

All of these are recorded in `scripts/parity/unported-files/thor.ts` or `SCOPED_SKIP_GROUPS`, never
stubbed.

## Existing stories

Every open story in the tasks repo whose title or body names Thor (grepped for `\bthor\b`,
`Thor::` and `thor/`, excluding "author" false matches), plus the command / generator stories
that retiring commander and splitting generators cannot land without:

| story                                                             | status | decision                                                                          |
| ----------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `0142/generator-base-thor-initialize-arguments-and-options-parse` | draft  | **rehome**, re-spec'd (phase 6)                                                   |
| `0142/generator-invoke-for-class-method-with-padding`             | draft  | **rehome** (phase 6)                                                              |
| `0142/generators-run-hooks-after-run-not-in-declaration-order`    | draft  | **rehome**, re-spec'd as the controller / resource / scaffold split               |
| `0142/generator-dispatch-help-mappings-arm`                       | draft  | **rehome** (phase 6)                                                              |
| `0142/thor-actions-template-is-unported`                          | draft  | **rehome**, re-spec'd as the copy / get / template port                           |
| `0142/thor-create-file-conflict-has-no-file-collision-prompt`     | draft  | **rehome**, re-spec'd as the `file_collision` port                                |
| `0142/action-methods-inside-chmod-shebang-delegates-unported`     | draft  | **rehome**                                                                        |
| `0142/vendor-thor-and-port-command-base-thor-surface`             | draft  | **rehome**, re-spec'd as `Command::Base < Thor` (vendoring landed in trails#8269) |
| `0142/port-rails-command-base-usage-and-banner`                   | draft  | **rehome**                                                                        |
| `0142/find-by-namespace-lookup-loads-only-candidates`             | draft  | **rehome**                                                                        |
| `0142/port-application-command-and-argv-scrubber`                 | draft  | **rehome**                                                                        |
| `0142/port-help-and-version-commands-for-split-namespace`         | ready  | **rehome**                                                                        |
| `0142/trails-cli-has-no-app-loader-exec-app`                      | ready  | **rehome**                                                                        |
| `0142/trails-new-reaches-app-generator-start`                     | ready  | **rehome**                                                                        |

Rehome rather than supersede: five of these are cited by `CONVERGEABLE` receipts in
`packages/trailties/src/{generators/base.ts,command/base.ts,command.ts}`, and closing a cited
story reds `stale-story-references.test.ts`. Keeping the ids keeps every receipt valid. The three
`ready` stories drop to `draft` under this RFC until it is `active`. They are gated on the port
either way.

**Stay in 0142, with a dependency on this RFC** (the `tasks set-deps` commands are in the PR body,
for after merge):

| story                                                   | status  | new dep                                                                                    |
| ------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `controller-generator-is-not-a-named-base`              | blocked | `thor-actions-template-is-unported`                                                        |
| `migration-template-expands-the-source-template-path`   | blocked | `thor-actions-template-is-unported`, `converge-create-migration-onto-thor-create-file`     |
| `wire-generators-onto-hook-for`                         | draft   | `rebase-generator-base-onto-thor-group`                                                    |
| `port-app-update-command-with-skip-option-preservation` | ready   | `port-thor-actions-module` (`update_command.rb:10` `include Thor::Actions`)                |
| `trails-test-command-ports-test-command`                | draft   | `vendor-thor-and-port-command-base-thor-surface` (`test_command.rb:36` defines Thor tasks) |

**This RFC depends on 0142 stories**: `generator-base-name-derived-from-bare-js-class-name`
(Ruby constant names, for `namespace`), `port-app-builder-and-build-dispatch` (the `AppBuilder`
move under `split-app-generator-into-thor-commands`), and
`port-rake-dsl-task-manager-for-app-tasks` (Rake, for `port-rails-command-rake-command`).
`generator-inherited-registers-templates-path-source-paths`,
`controller-generator-hook-targets-are-unported`,
`scaffold-controller-hooks-test-framework-and-engine-arms` and
`generators-configure-bang-api-only-no-color-fallbacks-templates` stay as they are. They touch
Rails' generator layer and get easier after phase 6, but do not block it.

**Already landed**, and this RFC builds on them: trails#8269 (`generators-have-no-thor-source-paths-or-template-files`:
vendoring and source paths), trails#8270 (`move-hand-written-generate-subcommand-flags-onto-generators`),
trails#8247 (`port-rails-command-base-thor-class-surface`), trails#8221
(`generator-base-has-no-thor-runtime-options`, `inject-into-file-diverges-from-thor-missing-file-and-lazy-revoke`),
and trails#8183 (`generator-and-command-bodies-bypass-thor-say`). The two stories this RFC's brief
listed as in progress (`generators-have-no-thor-source-paths-or-template-files`,
`move-hand-written-generate-subcommand-flags-onto-generators`) are `done`. Their code is the
starting point of `port-thor-actions-module` and the generator phase.

## Alternatives considered

- **Keep the drip.** File each Thor gap as a 0142 deviation story when a generator needs it. That
  is the status quo: about 20 Thor-shaped 0142 stories, each converging one call site onto a local
  copy, with a second copy in `command/base.ts`. It never deletes `generators/base.ts`' stand-ins
  or commander.
- **Port only what railties calls.** Thor's parser, dispatch, help and actions are one call graph.
  `Options#parse`, `Base#initialize`, `Group#dispatch` and `CreateFile` reach almost every file
  under `lib/thor`. The unreached remainder is exactly the Non-goals list.
- **Keep commander and map Thor options onto it.** Help text, `--no-` / `--skip-` switches,
  `check_unknown_options!`, `stop_on_unknown_option!`, exclusive / at-least-one relations and
  `-abc` clustering all differ from Thor's, and every railties command test asserts Thor's output.
- **A `@blazetrails/thor` package.** See decision 3.
- **Per-decision alternatives** are listed under each decision in § "Design".

## Rollout

| phase                                                                    | stories |    est-loc |
| ------------------------------------------------------------------------ | ------: | ---------: |
| 0. Minimal thor CI lane, enrollment, ruby-compat prerequisites           |       8 |      2,550 |
| 1. Parser, command and Thor::Base                                        |      10 |      4,050 |
| 2. Shell                                                                 |       5 |      1,800 |
| 3. Thor, Invocation, Group                                               |       4 |      1,550 |
| 4. Actions                                                               |       7 |      2,600 |
| 5. Spec fixtures and RSpec ports                                         |      15 |      6,500 |
| 6. Generators converge onto Thor::Group / Thor::Actions                  |      15 |      6,570 |
| 7. Commands converge onto Rails::Command::Base < Thor; commander retired |      17 |      6,110 |
| **Total**                                                                |  **81** | **31,730** |

Order: **thor-only CI lane → parser → base / command → group / invocation → shell → actions → consumer convergence**,
as the dependency graph enforces:

```text
ci: thor-only test lanes → ci: scoped comparison → errors (both gate the lib chain's root)
enroll ─→ errors ─┬→ argument/arguments → option ─┬→ options parser ─┐
                  ├→ HWIA ─────────────────────────┘                 │
                  └→ shell module ─┬→ printers, color                │
rc: arity ─────────────→ command ←─┘ (option)                        │
command + options parser → base DSL → base registry/methodAdded ─┬→ lint rule
                                                                 ├→ util
                                                                 └→ class DSL → dispatch/help ─┐
rc: gets → line editor/ask ─┐            base registry + util + shell → invocation ─┴→ group
line editor + create_file + rc: system → file_collision
invocation + shell + rc: cd, system → actions module ─┬→ apply
                    rc: fs verbs ─→ empty_dir/create_file/link ─┬→ template → directory
                                                                └→ inject → edits
dispatch/help → spec helper + fixtures → group/invoke fixtures → 13 spec-port stories
group + shell + lint (+ 0142 base-name) → rebase GeneratorBase → initialize/arguments ─┬→ file actions → named base, create_migration, generator actions
                                                                                      └→ split-* (5) → trails new / help arm / action methods
dispatch + invocation + shell + lint → Command::Base < Thor ─┬→ usage/banner, find_by_namespace → app loader
                                                              ├→ 6 command ports, application / help / version
                                                              └→ rake command (← 0142 rake DSL) → db ×2, app:template
all of the above → retire commander
```

Phases 1–4 are mostly independent within a phase: the shell (2) and the parser chain (1) run in
parallel from `port-thor-errors-nested-context-and-version`, and the spec ports (5) start as soon
as their lib story and fixtures land. Phases 6 and 7 can run in parallel once phase 3 is done.

### 0. Minimal thor CI lane, enrollment, ruby-compat prerequisites

| story                                               | est-loc | spec cases |
| --------------------------------------------------- | ------: | ---------: |
| `ci-thor-only-diffs-run-minimal-test-lanes`         |     350 |            |
| `ci-thor-only-diffs-scope-rails-comparison-to-thor` |     450 |            |
| `enroll-thor-specs-in-parity-test`                  |     400 |            |
| `ruby-compat-async-fs-verbs-for-thor-actions`       |     400 |            |
| `ruby-compat-fileutils-cd-block-restores-on-settle` |     250 |            |
| `ruby-compat-kernel-system-and-open3-capture2e`     |     300 |            |
| `ruby-compat-io-gets-and-noecho-for-line-editor`    |     250 |            |
| `ruby-compat-check-arity-raises-argument-error`     |     150 |            |

### 1. Parser, command and Thor::Base

| story                                                    | est-loc | spec cases |
| -------------------------------------------------------- | ------: | ---------: |
| `port-thor-errors-nested-context-and-version`            |     250 |          2 |
| `port-thor-argument-and-arguments`                       |     450 |         20 |
| `port-thor-option`                                       |     550 |         52 |
| `port-thor-core-ext-hash-with-indifferent-access`        |     300 |         13 |
| `port-thor-options-parser`                               |     450 |            |
| `port-thor-command`                                      |     400 |         10 |
| `port-thor-base-options-and-arguments-dsl`               |     500 |            |
| `port-thor-base-command-registry-method-added-and-start` |     500 |          1 |
| `thor-command-registration-lint-rule`                    |     300 |            |
| `port-thor-util`                                         |     350 |         24 |

### 2. Shell

| story                                                                        | est-loc | spec cases |
| ---------------------------------------------------------------------------- | ------: | ---------: |
| `port-thor-shell-module-basic-output-and-terminal`                           |     450 |          5 |
| `port-thor-shell-printers`                                                   |     300 |            |
| `port-thor-shell-color`                                                      |     350 |         24 |
| `port-thor-line-editor-and-ask`                                              |     350 |          4 |
| `thor-create-file-conflict-has-no-file-collision-prompt` (rehomed from 0142) |     350 |            |

### 3. Thor, Invocation, Group

| story                         | est-loc | spec cases |
| ----------------------------- | ------: | ---------: |
| `port-thor-class-dsl`         |     450 |            |
| `port-thor-dispatch-and-help` |     400 |            |
| `port-thor-invocation`        |     300 |            |
| `port-thor-group`             |     400 |            |

### 4. Actions

| story                                                   | est-loc | spec cases |
| ------------------------------------------------------- | ------: | ---------: |
| `port-thor-actions-module`                              |     400 |            |
| `port-thor-actions-apply`                               |     250 |            |
| `port-thor-empty-directory-create-file-and-create-link` |     400 |            |
| `thor-actions-template-is-unported` (rehomed from 0142) |     450 |            |
| `port-thor-directory-action`                            |     350 |         20 |
| `port-thor-inject-into-file`                            |     450 |         23 |
| `port-thor-file-manipulation-edits`                     |     300 |            |

### 5. Spec fixtures and RSpec ports

| story                                                  | est-loc | spec cases |
| ------------------------------------------------------ | ------: | ---------: |
| `port-thor-spec-helper-and-script-fixtures`            |     600 |            |
| `port-thor-spec-group-and-invoke-fixtures`             |     400 |            |
| `port-thor-options-spec-part-1`                        |     350 |         46 |
| `port-thor-options-spec-part-2`                        |     350 |         43 |
| `port-thor-spec-part-1`                                |     500 |         63 |
| `port-thor-spec-part-2`                                |     500 |         52 |
| `port-thor-base-spec`                                  |     450 |         51 |
| `port-thor-group-and-invocation-specs`                 |     450 |         56 |
| `port-thor-register-subcommand-and-sort-specs`         |     450 |         25 |
| `port-thor-shell-basic-spec-part-1`                    |     350 |         36 |
| `port-thor-shell-basic-spec-part-2`                    |     350 |         35 |
| `port-thor-actions-spec`                               |     500 |         63 |
| `port-thor-create-file-link-and-empty-directory-specs` |     550 |         47 |
| `port-thor-file-manipulation-spec-part-1`              |     350 |         33 |
| `port-thor-file-manipulation-spec-part-2`              |     350 |         43 |

### 6. Generators converge onto Thor::Group / Thor::Actions

| story                                                                                    | est-loc | spec cases |
| ---------------------------------------------------------------------------------------- | ------: | ---------: |
| `rebase-generator-base-onto-thor-group`                                                  |     600 |            |
| `generator-base-thor-initialize-arguments-and-options-parse` (rehomed from 0142)         |     550 |            |
| `generator-invoke-for-class-method-with-padding` (rehomed from 0142)                     |     120 |            |
| `converge-generator-base-file-actions-onto-thor-actions`                                 |     600 |            |
| `converge-named-base-onto-thor-argument-and-template-override`                           |     350 |            |
| `converge-create-migration-onto-thor-create-file`                                        |     300 |            |
| `converge-rails-generators-actions-onto-thor-actions`                                    |     550 |            |
| `split-model-and-migration-generators-into-thor-commands`                                |     500 |            |
| `generators-run-hooks-after-run-not-in-declaration-order` (rehomed from 0142)            |     650 |            |
| `split-credential-and-devcontainer-generators-into-thor-commands`                        |     450 |            |
| `split-authentication-benchmark-script-task-and-generator-generators-into-thor-commands` |     450 |            |
| `split-app-generator-into-thor-commands`                                                 |     650 |            |
| `trails-new-reaches-app-generator-start` (rehomed from 0142)                             |     300 |            |
| `generator-dispatch-help-mappings-arm` (rehomed from 0142)                               |     350 |            |
| `action-methods-inside-chmod-shebang-delegates-unported` (rehomed from 0142)             |     150 |            |

### 7. Commands converge onto Rails::Command::Base < Thor; commander retired

| story                                                                    | est-loc | spec cases |
| ------------------------------------------------------------------------ | ------: | ---------: |
| `vendor-thor-and-port-command-base-thor-surface` (rehomed from 0142)     |     450 |            |
| `port-rails-command-base-usage-and-banner` (rehomed from 0142)           |     300 |            |
| `find-by-namespace-lookup-loads-only-candidates` (rehomed from 0142)     |     350 |            |
| `port-generate-and-destroy-commands-onto-rails-command-base`             |     300 |            |
| `port-server-command-onto-rails-command-base`                            |     400 |            |
| `port-console-command-onto-rails-command-base`                           |     300 |            |
| `port-routes-commands-onto-rails-command-base`                           |     300 |            |
| `port-credentials-and-encrypted-commands-onto-rails-command-base`        |     550 |            |
| `port-notes-stats-and-dev-commands-onto-rails-command-base`              |     300 |            |
| `port-application-command-and-argv-scrubber` (rehomed from 0142)         |     400 |            |
| `port-help-and-version-commands-for-split-namespace` (rehomed from 0142) |     160 |            |
| `trails-cli-has-no-app-loader-exec-app` (rehomed from 0142)              |     300 |            |
| `port-rails-command-rake-command`                                        |     300 |            |
| `move-db-commands-onto-databases-rake-tasks-part-1`                      |     600 |            |
| `move-db-commands-onto-databases-rake-tasks-part-2`                      |     600 |            |
| `move-app-template-command-onto-framework-rake-task`                     |     150 |            |
| `retire-commander-cli-onto-rails-command-invoke`                         |     350 |            |

## How we estimated

The goal is an estimate we can check against actuals, so the method is written down:

- **Lib ports:** Thor code lines (without comments and blank lines, per file above) × ~1.3 for the
  TS body with JSDoc citations, plus one `.trails.test.ts` case per predicted fidelity trap
  (~15–25 lines each). Rounded up to the nearest 50.
- **Spec ports:** Ruby spec lines × ~1.35 (async `await`, explicit fixtures, vitest matchers).
  Spec files over ~450 TS lines are split at a top-level `describe` boundary. Each story lists
  its cases, so a case count can be compared per story.
- **Fixtures:** `.thor` lines × 1.3, plus the data tree.
- **Consumer convergence:** measured from the trailties files touched. Deleted lines count
  (the ceiling counts additions + deletions): `generators/base.ts` loses ~600 lines across three
  stories, and `commands/db.ts` (992 lines) moves across two. Generator splits are sized by
  generator count and file size, with ~40–120 lines of test churn per generator.
- **CI stories:** workflow and gate-script lines plus `ci-suite-coverage.test.ts` cases (~40 per
  scenario), and per-ratchet `--package` plumbing for the comparison job.
- **Rehomed stories** were re-estimated on the same basis. Seven had no estimate before.
- **Outside this RFC's total:** the three 0142 stories it depends on
  (`generator-base-name-derived-from-bare-js-class-name` 120,
  `port-app-builder-and-build-dispatch` unestimated, and
  `port-rake-dsl-task-manager-for-app-tasks` unestimated). The last two are the largest external
  risk to the schedule.
- **Not in the estimate:** review-round rework and CI-flake reruns. Growth would come from
  spec cases that expose port bugs, which should be filed as stories under this RFC with the
  Ruby `file:line`.

To compare later: count stories under this RFC (not superseded) and sum shipped PR LOC
(additions + deletions, same exclusions as the ceiling), against **81 / 31,730**.

## Seed completeness

Every Thor lib file is either assigned to a story or listed as a non-port. Every one of the 791
portable spec cases is assigned by name to exactly one story. Every trailties file that fakes
Thor (`generators/base.ts`, `command/base.ts`, `generators/actions.ts`, `trails-actions.ts`,
`named-base.ts`, `app-base.ts`, `tse.ts`, `actions/create-migration.ts`, `cli.ts`, `command.ts`,
`bin.ts`, the 14 `commands/*.ts`, and the 26 generator classes) has a converging story. A story added later is a
spec miss. Note it as one in the new story's Context, citing the Thor or Rails line this authoring
missed.

## Verification

- `pnpm parity:api --package thor` reads every ported file at 100%, and the five non-port
  files read as unported with their reasons.
- `pnpm parity:test` has a `thor` block crediting all 791 portable cases, and the 77 others read
  as unported.
- `git grep -n commander packages` is empty, and `packages/trailties/package.json` has no
  `commander`.
- `packages/trailties/src/generators/base.ts` and `command/base.ts` carry no Thor stand-ins
  (`parity:api:extra --package trailties` drops accordingly), and no receipt in trailties cites a
  story of this RFC once that story is done.
- `bin/trails --help`, `bin/trails g model --help`, a `trails new` run, an interactive file
  collision (`n` / `y` / `a` / `d`), and `bin/trails db:migrate` behave as their Rails
  counterparts do.
- `parity:api` / `parity:test` deltas for every other package are non-negative at every step.

## Open questions

1. **Does the explicit-`methodAdded` shape need a codemod for app-authored generators?**
   Recommendation: no separate codemod. `thor-command-registration-lint-rule`'s autofix covers
   in-repo code, and `trails g generator`'s template emits the static block
   (`split-authentication-benchmark-script-task-and-generator-generators-into-thor-commands`).
   Resolved there.
2. **Should `db:*` move to Rake here, or in its own RFC?** Recommendation: here. Commander
   cannot be retired without it, and the move re-wraps existing `DatabaseTasks` calls rather than
   porting new behavior. If `port-rake-dsl-task-manager-for-app-tasks` (0142) is re-scoped into
   its own RFC, the two `move-db-*` stories follow it. Resolved at `port-rails-command-rake-command`.
3. **Does the website need a browser `LineEditor`?** Recommendation: not in this RFC. The browser
   process adapter answers `gets` with EOF, which Thor treats as "yes" (`basic.rb:218-220`), and
   that matches today's always-force behavior. A real browser prompt is deferred to a website
   story if one is ever wanted. Resolved in `ruby-compat-io-gets-and-noecho-for-line-editor`.

## Changelog

- 2026-09-30: initial RFC (81 stories: 67 new, 14 rehomed from 0142; 31,730 est-loc), with the
  thor-only CI lane first.
