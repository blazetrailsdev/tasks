---
rfc: "0135-platform-adapters-in-ruby-compat"
title: "The platform adapters move into ruby-compat and arrive as Ruby: File, Dir, FileUtils, Pathname and Process are the surface, the FsAdapter shape becomes an internal backend contract, and rack depends on a leaf alone"
status: active
created: 2026-09-02
updated: 2026-09-02
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - rack
  - rack-session
  - actionpack
  - actionview
  - activerecord
  - activerecord-cli
  - trailties
clusters:
  - fidelity
  - tooling
related-rfcs:
  - "0129-ruby-compat"
  - "0133-rack-session-gem-port"
  - "0089-corelib-primitives"
priority: 2
---

# RFC 0135 — the platform adapters live in `@blazetrails/ruby-compat`

## Summary

Seven `*-adapter.ts` files in `packages/activesupport/src` (1887 LOC) are the
seam through which trails reaches `node:fs`, `node:crypto`, `node:os`,
`process`, `node:http`, `node:child_process` and `AsyncLocalStorage` without any
package statically importing them. **They move into `ruby-compat`, registration
and Node bootstrap included — and they arrive wearing Ruby's names.**

`ruby-compat` exports `File`, `Dir`, `FileUtils`, `Pathname`, `IO` and
`Process`. `FsAdapter` / `getFs()` stop being public API and become the
**backend contract** a platform registers against:

```ts
// today, activesupport
if (getFs().existsSync(getPath().join(dir, key))) …
// after
if (File.isExist(File.join(dir, key))) …
```

Rails writes `File.exist?(path)` (`cache/file_store.rb:123,133,201,205`). That
is the whole argument.

This RFC reverses RFC 0129 **non-goal 2**, which ruled the `*-adapter.ts` family
out of `ruby-compat` on the grounds that it is "the Node platform adapter, which
is not Ruby semantics". That reasoning is sound about what the adapters _are_
and wrong about what follows from it, because RFC 0129's own ledger records the
cost: two of its stories are `blocked` on exactly this question, and the story
meant to settle it was closed without shipping.

## Motivation

### 1. The deferral has a measured price, paid in three places

- `move-tempfile-to-ruby-compat` — **blocked**. Its reason: "Tempfile imports
  `getFs`/`getPath` (fs-adapter, 483 LOC), `getOs` (os-adapter, 158) and
  `getCrypto` (crypto-adapter, 393) from activesupport. ruby-compat is a leaf …
  The move needs a home for the fs/os/crypto seat decided first."
- `move-monitor-mixin-to-ruby-compat` — **blocked** on
  `async-context-adapter.ts`, the same wall.
- `packages/rack` and `packages/rack-session` both declare
  `@blazetrails/activesupport` in `dependencies`. The **Ruby `rack` gem has no
  runtime dependencies at all**, so this is a fidelity deviation with nothing
  tracking it. Its remaining content, once RFC 0129's re-export shims are gone,
  is _entirely_ adapter symbols: `getFs` (5 files), `getPath` (5), `getCrypto`
  (2), `FsStatResult`, `cwd`, `platform`, `stderr`, `HttpRequest` /
  `HttpResponse` / `HttpServer` / `getHttpAsync`.

`ruby-named-file-dir-fileutils-facade` was to decide this and was **closed, not
shipped**; its closure note states that "the platform-adapter/leaf-rule question
(RFC 0129 non-goal 2) stays open and unsettled". So the question is not deferred
to an owner — it has no owner.

### 2. The registry/backend split this needs is already built, seven times

`move-monitor-mixin-to-ruby-compat`'s blocker note claims "no
`registerFsBackend()`-shaped precedent exists to copy". That is wrong on the
facts. Every adapter already exposes a registration seam:

| adapter                    | LOC | registration                                |
| -------------------------- | --- | ------------------------------------------- |
| `fs-adapter.ts`            | 483 | `registerFsAdapter(name, fs, path)` :161    |
| `crypto-adapter.ts`        | 393 | `registerCryptoAdapter(name, adapter)` :282 |
| `process-adapter.ts`       | 393 | `registerProcessAdapter(adapter)` :170      |
| `child-process-adapter.ts` | 212 | `registerChildProcessAdapter(...)` :54      |
| `os-adapter.ts`            | 158 | `registerOsAdapter(name, adapter)` :31      |
| `async-context-adapter.ts` | 140 | `registerAsyncContextAdapter(...)` :71      |
| `http-adapter.ts`          | 108 | `registerHttpAdapter(name, adapter)` :44    |

There is no architecture to invent. This is a file move plus an import rewrite.

### 3. The gate exempts these names today; this RFC retires the exemption

`extract-ruby-api.rb:3008-3011` holds `CORE_CLASS_RECEIVERS`:

```ruby
CORE_CLASS_RECEIVERS = %w[
  File Dir IO Module Class Proc Kernel Marshal ObjectSpace GC Process Thread
  Mutex Encoding Random Signal Struct Method
].to_set.freeze
```

Every call on one of those receivers is dropped from the Ruby call-set before
the gate compares. PR #6680 (`8a2145ceb`) added it and deleted 74 baseline rows
as stale, on the reasoning that a call to `File.exist?` is _Ruby_, not a ported
collaborator, so no TS body could be expected to make it.

**That reasoning expires the moment `ruby-compat` exports `File`.** Once
`File.isExist` is a real, callable trails member, a body that reaches the
filesystem some other way is making a divergence the gate should see. So the
exemption is not a permanent rule — it is a **burndown ledger of receivers
trails cannot yet spell**, and it shrinks as this RFC lands classes.

This is what closed `ruby-named-file-dir-fileutils-facade`: "a File/Dir facade
would credit no gate row". True while the exemption stands, and this RFC's
answer is to remove the exemption rather than to accept the verdict. Measured
across `vendor/rails/**/*.rb`, the receivers in scope:

| receiver                                                                                                                      | Rails calls   | status after this RFC                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------- |
| `File`                                                                                                                        | 1415          | unexempted                                    |
| `Dir`                                                                                                                         | 306           | unexempted                                    |
| `Process`                                                                                                                     | 109           | unexempted                                    |
| `IO`                                                                                                                          | 50            | unexempted                                    |
| `FileUtils`                                                                                                                   | ~280          | **never exempt** — already in the call-set    |
| `Class` `Thread` `Struct` `Proc` `Marshal` `Module` `Encoding` `Mutex` `Kernel` `GC` `ObjectSpace` `Method` `Random` `Signal` | 1834 combined | **stay exempt**, each retired by its own port |

Two disciplines follow, and they are the risk in this RFC:

- **The list is only-shrink.** A receiver leaves `CORE_CLASS_RECEIVERS` when
  `ruby-compat` can spell it, and nothing is ever added back to quiet a red run.
- **A receiver leaves the list only in a story that leaves the gate green.**
  Removing `File` resurrects every `File.*` row in a ported body at once, and
  `File` is far too large to flip in one PR. So the call-site flips are
  dependency stories, per package, and the unexemption is the last story in the
  chain — the one that turns the gate on, with nothing left for it to catch.
  A receiver small enough to flip in a single PR (`IO`, `Process`) unexempts in
  that same story. The Rails-wide counts above are an upper bound, not
  the gate population — the first story measures the ported-body subset with
  `API_COMPARE_FORCE=1 pnpm parity:api --calls` before committing to a lane.

`FileUtils` is the cheap proof: it was never in `CORE_CLASS_RECEIVERS`, so its
62 `rm_rf` / 42 `mkdir_p` / 32 `touch` / 25 `cd` calls are in the call-set
already and are being missed silently right now.

### 4. The browser property survives the move — the guard's wording does not

The reason the adapters look un-leaf-like is `tryAutoRegisterNode()`, which
lazily resolves the Node backend so callers never have to register one. It never
names a builtin in a bundler-visible position (`fs-adapter.ts:250-276`):

```ts
if (typeof globalThis.process === "undefined" || !globalThis.process.versions?.node) return false;
const req = syncBuiltinLoader(); // process.getBuiltinModule, else createRequire()
const nodeFs = req("node:fs");
```

No static `import`, no dynamic `import()`. A browser bundle resolves zero Node
modules and bails at the `process.versions.node` guard at runtime. The property
RFC 0129's leaf rule protects is therefore **preserved** by the move.

What is not preserved is the _current wording_ of the guard.
`scripts/ruby-compat-leaf.ts:36-64` walks the built output's AST and records
`require()` and `import()` argument strings alongside static specifiers, so
`require("node:module")` counts as a violation today. The guard must narrow to
**"takes no static Node import"**.

**This is the part of this RFC that most deserves review.** A guard is being
weakened, and `enforce-ruby-compat-leaf-and-browser-freedom` (#7383) exists
precisely because the leaf property previously "held by luck". The narrowing is
defensible only because the runtime `process.versions.node` guard is what
actually delivers browser-safety and the AST check was a proxy for it — but it
is a narrowing, and it should be argued in the PR, not assumed.

## Design

### The lanes

1. **The guard first.** Narrow `ruby-compat-leaf.ts` to static imports, and
   settle the ambient-global question: `eslint.config.mjs:253-269` bans the bare
   `Buffer`, `process`, `__dirname` and `__filename` identifiers in
   `ruby-compat/src/**`. The adapters read `globalThis.process` throughout (a
   property access, not the banned global), but `syncBuiltinLoader`
   (`fs-adapter.ts:250-263`) uses **`__filename`**, which is banned. Audit
   before moving, not after.
2. **`FileUtils` first, because it needs no exemption change.** Its calls are
   already in the call-set, so it proves the class shape, the receipt shape and
   the mark movement against live gate rows and nothing else.
3. **Then one class per story**, each landing three things together: the
   Ruby-named class in `ruby-compat`, its receiver's removal from
   `CORE_CLASS_RECEIVERS`, and the converged call sites. `IO` (50) and
   `Process` (109) before `Dir` (306) and `File` (1415).
4. **`crypto` / `os` / `http` / `child-process` / `async-context` move with
   their current shape**, and are re-dressed as `SecureRandom`, `Digest`,
   `Process` and friends by their own later stories. They are not on the
   critical path for rack.
5. **`no-node-builtins.mjs` retargets.** Its replacement table
   (`eslint/no-node-builtins.mjs:9-28`) hard-codes `@blazetrails/activesupport`
   / `getFs` / `getPath` / `getCrypto` as the fix for `fs`, `path` and `crypto`.
   After this RFC the correct advice is `@blazetrails/ruby-compat` and `File` /
   `Dir`, so the table and its autofix change with the classes.
6. **rack and rack-session drop the dependency**, the acceptance test for the
   whole RFC.

### Naming is determined, not designed

`rubyMethodToTs` in `scripts/parity/conventions.ts` already produces every
member name; confirm against it rather than inventing. Verified 2026-09-02:

| Ruby                                             | TS                               |
| ------------------------------------------------ | -------------------------------- |
| `File.exist?`                                    | `File.isExist`                   |
| `File.directory?`                                | `File.isDirectory`               |
| `File.expand_path`                               | `File.expandPath`                |
| `File.join` / `dirname` / `basename` / `extname` | unchanged                        |
| `FileUtils.mkdir_p`                              | `FileUtils.mkdirP`               |
| `FileUtils.rm_rf` / `rm_f` / `cp_r`              | `FileUtils.rmRf` / `rmF` / `cpR` |
| `Dir.glob`                                       | `Dir.glob`                       |

If a name you want is not what that function produces, the name is the bug.
Note `fs-adapter.ts` already carries `rm` and `rmF` on its Node wrapper — the
Ruby shape has been leaking in ad hoc, unowned, for some time.

### Shim deletion is part of each move, not a trailing sweep

RFC 0129 ran this sweep twice and is owed a third.
`delete-ruby-compat-reexport-shims` (done, #7300) named only the five files it
touched; every later move orphaned a fresh shim pointing at an already-closed
story, which is why `delete-second-round-ruby-compat-reexport-shims` exists —
and that story's list is _already_ stale. Uncovered on main today:
`activesupport/src/include.ts`, `prepend.ts`, `method-missing-proxy.ts` (whole
files), and `index.ts:2` (`KeyError`), `:3` (`regexpEscape`), `:709` (`Range`).

This RFC does not repeat the pattern: **no story here may defer its shim
deletion to a later story.**

## Blast radius

~120 files import an adapter symbol, across every package but `arel` and `date`:

| symbol            | actionpack | activerecord | activesupport | rack | rack-session | trailties | other |
| ----------------- | ---------- | ------------ | ------------- | ---- | ------------ | --------- | ----- |
| `getFs`           | 9          | 16           | 12            | 5    | —            | 5         | 2     |
| `getCrypto`       | 12         | 6            | 18            | 1    | 1            | 1         | 1     |
| `getOs`           | 1          | 5            | 3             | —    | —            | —         | —     |
| `getChildProcess` | 1          | 3            | 2             | —    | —            | 2         | —     |
| `getHttpAsync`    | —          | —            | 3             | 1    | —            | —         | —     |
| `getAsyncContext` | —          | —            | 4             | —    | —            | —         | —     |

Import-specifier rewrites only — no call site changes shape.

## Non-goals

- **Changing any adapter's semantics.** The surface is re-dressed as Ruby and
  the implementation is not. A behavioural fix found en route is a separate
  story, and a Ruby-named member whose semantics differ from MRI's is a bug in
  this RFC, not a licence to reimplement the filesystem.
- **Emptying `CORE_CLASS_RECEIVERS`.** Fourteen receivers (`Class`, `Thread`,
  `Struct`, …) stay exempt. Each is retired by the port that can spell it, on
  its own evidence — not by this RFC.
- **A `ruby-compat-node` package.** Considered and rejected: it keeps the AST
  guard verbatim, but a ninth package earns its keep only if something must
  statically import Node, and nothing does.
- **Registration from outside `ruby-compat`.** Every `register*Adapter` call and
  every Node bootstrap lands in the leaf. A consumer that wants a non-Node
  backend still calls the registration function; no package re-registers on
  another's behalf.

## Sanctioned residue

Two findings from the flip chain are recorded here rather than converged,
because there is nothing on the Ruby side to converge to.

### `getPath().pathToFileURL` in `DatabaseTasks.loadSchema`

`packages/activerecord/src/tasks/database-tasks.ts:658` keeps `getPathAsync()`
for one call: turning an absolute schema path into a `file://` href for
`import()`. Rails' body is `load(file)`
(`activerecord/lib/active_record/tasks/database_tasks.rb`), which has no URL
step at all — Ruby's `load` takes the path. The href exists only because ESM's
dynamic `import()` will not take an absolute POSIX path on every platform, so
there is no Ruby member for `File` or `Dir` to grow: a `File.pathToFileUrl`
would be invented surface named after a Ruby method that does not exist.

So the `PathAdapter` keeps this one seat, and the "no `getFs()` / `getPath()`
outside `ruby-compat`" criterion reads as "outside `ruby-compat` and this call".
The residue disappears if `load` ever ports to something that resolves the
module itself; it is not waiting on a `File` member.

### A `@noRailsEquivalent` receipt DOES exempt a member in a `NoCntrp` file

`extra-surface-gate-blocks-new-file-dir-members` was filed on the premise that
`scripts/api-compare/extra-surface.ts` scores a file "no Rails file maps onto"
with an empty allowed set, and that a receipt therefore cannot exempt a name
there. Measured, that is not what happens. The empty allowed set only means
nothing is pre-allowed from a counterpart `.rb`; the per-declaration tag check
runs BEFORE the novel/moved classification (`extra-surface.ts`, the
`tagKeys.has(allowKey)` arm), so a tagged member is counted as `Allowed` and
subtracted from both `novel` and `total` in a `NoCntrp` file exactly as in a
Rails-mapped one.

Verified on this branch by adding one member to `packages/ruby-compat/src/dir.ts`
and measuring twice: untagged it scored `ruby-compat novel 1, total 31`; with a
`@noRailsEquivalent PERMANENT` receipt and nothing else changed, `novel 0, total
30`. No other property of the name is an input — neither its Rails hit count nor
whether it scores `novel` or `moved`.

The rule for a `NoCntrp` file is therefore: **every public member counts toward
`total` unless it carries its own `@noRailsEquivalent` receipt.** `Dir.pwd`
raised the total in #7442 because it landed without one; `File.mtime` and
`File.binwrite` did not because they landed with one. The remaining flip stories
need no mark work — each new `File`/`Dir`/`IO`/`Process` member carries its MRI
citation and its receipt, and the gate stays green.

## Acceptance criteria for the RFC

- `packages/rack/package.json` and `packages/rack-session/package.json` declare
  no `@blazetrails/activesupport` dependency.
- `move-tempfile-to-ruby-compat` and `move-monitor-mixin-to-ruby-compat` are
  unblocked.
- No `*-adapter.ts` remains in `packages/activesupport/src`, and no re-export
  shim for one remains either.
- `scripts/ruby-compat-leaf.test.ts` still passes, over the narrowed rule, with
  the adapters in the package.
- `File`, `Dir`, `IO` and `Process` are gone from `CORE_CLASS_RECEIVERS`, and
  the call gates are green with them gone.
- No ported body reaches the filesystem through a Node-shaped name: a
  workspace-wide grep for `existsSync`, `readFileSync`, `unlinkSync` and
  `statSync` outside `ruby-compat/src` returns nothing.
