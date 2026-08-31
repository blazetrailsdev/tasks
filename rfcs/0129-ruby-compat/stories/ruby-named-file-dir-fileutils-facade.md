---
title: "A Ruby-named File / Dir / FileUtils facade so ported bodies name what Rails names"
status: draft
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Re-scoped from `0023-surfaced-deviations/fs-adapter-node-names-hide-rails-file-calls`
(draft, never worked), which is closed against this story. Its diagnosis is
right and still live; its home and its scope were both wrong. 0023 is the
retired catch-all, and it proposed the façade as "a shared activesupport
surface" — but `File`, `Dir` and `FileUtils` are **Ruby**, not Rails. Charging
them to activesupport is the same inversion RFC 0129 exists to correct.

**The debt.** Rails reaches the filesystem through Ruby's `File` / `Dir` /
`FileUtils`, and the call-parity gate matches on those Ruby method names. trails
routes every filesystem call through the fs-adapter
(`packages/activesupport/src/fs-adapter.ts`, 483 lines), whose members are named
after node's `fs`. So a body that makes **exactly** the Rails call still reads to
the gate as a missing call. Live examples, all in one ported body:

- `packages/activesupport/src/cache/file-store.ts:176, 193, 200, 208, 221, 326`
  — `getFs().existsSync(key)` where `file_store.rb:123, 133, 201, 205` writes
  `File.exist?(path)`.
- `file-store.ts:291, 311-318` — a comment reading "Rails compares
  `File.realpath(dir) == File.realpath(cache_path)`" sitting above
  `fs.realpathSync`. The comment exists because the code cannot say it.

Scale of the naming surface, measured across the workspace (non-test unless
noted): **60 files in 7 packages** call `getFs()` / `getPath()` — activerecord
17, actionpack 13, activesupport 13, trailties 8, rack 6, actionview 2,
activerecord-cli 1. By member, `existsSync` 24, `readFileSync` 18, `unlinkSync`
14, `statSync` 11; on the path side `join` 20, `resolve` 13, `extname` 9,
`dirname` 7, `basename` 6.

**Verify the baseline evidence first.** 0023's story cites five `exist?` rows in
`scripts/api-compare/call-mismatches-exclude/activesupport/cache/file-store.json`.
Those rows are **no longer there** — the shard holds two `kind: "args"` rows
(`decode_www_form_component`, `split`) and nothing else. Establish where that
debt went before writing code: it was either converged, or paid down into
`@missingRailsCall` receipts at the call sites, or pruned. If it turned into
receipts, those receipts are this story's real burndown target and the story is
still worth doing; if it genuinely converged some other way, re-scope or block
rather than building a façade for debt that no longer exists.

**The counter-argument, recorded so it is weighed and not rediscovered.** RFC
0129's README notes `File.join` is 96 Rails calls and `File.expand_path` 97, but
**no port hand-rolls their semantics** — so unlike `Rational` or `Hash#fetch`,
the debt here is _naming only_, not duplicated implementation. That makes this a
weaker case than the value-type moves. It is still real (the gate cannot credit
a call it cannot see), but it means the deliverable is a thin naming façade over
the existing adapter, never a reimplementation of filesystem semantics.

### The blocking decision: where a façade can live

ruby-compat is a **leaf that takes no workspace dependencies** (README §4). A
`File.exist?` façade must reach the filesystem, and the filesystem lives behind
`getFs()` in activesupport — so a naive façade in ruby-compat imports
activesupport and breaks the leaf rule. This is the **same wall**
`move-tempfile-to-ruby-compat` hits (`tempfile.ts` imports `getCrypto`, `getFs`,
`getPath`, `getOs`), and 0129's README names it: the platform-adapter question
in non-goal (2) is "a genuine architectural decision about where platform
abstraction lives … worth its own [RFC] once this one has proved out".

Settle it in this story, for both this façade and Tempfile. Three shapes:

1. **Recommended — ruby-compat owns the Ruby-named surface and its own
   registration.** ruby-compat exports the `File` / `Dir` / `FileUtils` façade
   plus a `registerFsBackend()` of its own; activesupport's existing
   `registerFsAdapter` (`fs-adapter.ts:161`) forwards into it at registration
   time. No workspace import in either direction at module scope, the leaf rule
   holds, and it is the registry shape the repo already uses. Cost: two
   registration points until the adapter itself moves.
2. **Move `fs-adapter.ts` to ruby-compat.** Cleanest end state, largest blast
   radius: `eslint/no-node-builtins.mjs` hard-codes `@blazetrails/activesupport`
   as the replacement import for `fs`, `path` and `crypto`, so this is a
   lint-contract change plus a 60-file import flip. Too big for one PR and it
   drags `crypto`/`os` along. If this is the right end state, this story lands
   (1) and files it.
3. **Façade in activesupport.** What 0023 proposed. Rejected: it permanently
   charges Ruby's surface to a Rails-measured package, which is what 0129
   exists to stop.

Whichever is chosen, state it in the PR body and update RFC 0129's non-goal (2)
so the README stops describing the question as unsettled.

### Naming is already determined — do not invent it

`scripts/parity/conventions.ts` (predicate policy, ~:1396-1416) already produces
the façade's names, so this needs no new rule: bare predicates yield the
isPrefixed form first (`exist?` → `isExist`, `exist`), and `File.directory?` →
`isDirectory` / `directory`. Confirm each façade member against
`rubyMethodToTs` before writing it — if a name you want is not what that
function produces, the name is the bug.

### Scope: one body, not all sixty

The LOC ceiling and the one-story-one-PR rule both forbid flipping 60 files
here. Build the façade, flip **FileStore only** (the body with the measured
debt), and file the remaining packages as their own stories with the
`file:line`s already listed above. A per-package flip is mechanical once the
façade and the registration decision exist.

## Acceptance criteria

- [ ] The baseline question above is answered in the PR body: where the five
      `exist?` rows went, and what this story's actual burndown target is.
- [ ] The leaf-rule decision is made, implemented, and stated in the PR body;
      RFC 0129's non-goal (2) is updated to record it, and
      `move-tempfile-to-ruby-compat` is unblocked by it or explicitly noted as
      still blocked and why.
- [ ] A Ruby-named `File` / `Dir` / `FileUtils` façade exists, with members
      spelled as `rubyMethodToTs` produces them, covering at minimum the members
      FileStore needs: `exist?`, `directory?`, `realpath`, `delete`, `dirname`,
      `join`, `read`, `write`, `mkdir_p`.
- [ ] Every façade member carries both halves of the ruby-compat contract
      (README §2): a resolving `vendor/ruby/<file>:<line>` citation — `file.c`,
      `dir.c`, and `lib/fileutils.rb` for the pure-Ruby half — and a
      `@noRailsEquivalent PERMANENT` receipt.
- [ ] `packages/activesupport/src/cache/file-store.ts` calls the façade rather
      than `getFs()` at the sites listed above; the "Rails compares
      File.realpath(...)" comment at `:291` is deleted because the code now says
      it.
- [ ] Any `@missingRailsCall` receipt or baseline row in
      `call-mismatches-exclude/activesupport/cache/file-store.json` that this
      converges is **deleted by hand**, and the resulting stale high-water mark
      narrowed with `pnpm parity:api:calls:tighten activesupport/cache/file-store.json`.
      No reseed.
- [ ] `pnpm parity:api:extra:gate` holds ruby-compat: the façade's members raise
      the mark, so that raise is a reviewed line of this diff with the new
      figure stated in the PR body — never a `tighten`/reseed.
- [ ] Follow-up stories filed for the remaining `getFs()` / `getPath()` callers,
      one per package, each carrying the counts above so no one re-derives them.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
