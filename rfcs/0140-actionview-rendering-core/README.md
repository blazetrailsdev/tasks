---
rfc: "0140-actionview-rendering-core"
title: "ActionView rendering core — the non-helper half to parity"
status: active
created: 2026-09-08
updated: 2026-09-08
owner: "@deanmarano"
packages:
  - "actionview"
clusters: []
priority: 2
---

# RFC 0140 — ActionView rendering core

## Summary

Port the **non-helper** half of ActionView: the template representation,
dependency tracking, digest tree, and the dev-mode cache invalidation that hangs
off them. This is the prerequisite slice that unblocks actionpack, and it
deliberately excludes `helpers/**`, which is a separate campaign.

## Motivation

### Measured state, 2026-09-08

`pnpm parity:api` reports actionview at **495/921 methods (53.7%)**, with 38 of
92 Rails files present. That headline is misleading in a way that matters for
scheduling: the gap is concentrated in helpers, not in rendering.

| Bucket                              | Files | Methods |
| ----------------------------------- | ----- | ------- |
| Absent — `helpers/**`               | 29    | 94      |
| Absent — rendering core             | 25    | 168     |
| Missing methods in ported `helpers/**` | —  | 77      |
| Missing methods in ported core      | —     | 87      |

The rendering core is already substantially there — `base.rb` 43/47,
`template.rb` 30/41, `rendering.rb` 17/28, `lookup_context`, `path_set`,
`resolver`, `renderer/**` all present. What is missing is a nameable list, and
this RFC ports it.

### Why this blocks actionpack

actionpack declares `add_dependency "actionview"` in its gemspec, and its lib
makes 43 references to `ActionView` across 20+ files (`metal/rendering.rb`,
`renderers.rb`, `helpers.rb`, `etag_with_template_digest.rb`, `form_builder.rb`,
`live.rb`, `streaming.rb`, `abstract_controller/helpers.rb`, `debug_view.rb`,
`exception_wrapper.rb`). Of actionpack's 2,544 missing Rails tests, roughly 926
sit in view-coupled test files — `render_test.rb` (81), `test_case_test.rb`
(126), `filters_test.rb` (47), `respond_to_test.rb` (38), `renderer_test.rb`
(25), `new_base/render_action_test.rb` (23).

Those need the rendering core. They do not need `date_select` or
`atom_feed_helper`. Splitting the slice on that line is what makes actionpack
schedulable without first absorbing the whole helper backlog.

### The digest chain is the load-bearing gap

`packages/actionview/src/digestor.ts` is a 32-line stub — 13 of its 14 methods
absent. It looks up one template and returns `fnv1a64Hex("name|format|source")`:
no tree, no partial recursion, and the `dependencies` option is declared and
dropped. Everything downstream of it is therefore also absent:

```text
Digestor.tree
  -> DependencyTracker.find_dependencies(name, template, view_paths)
       -> tracker = @trackers[template.handler]     # register_tracker :erb, ERBTracker
            -> ERBTracker#dependencies
                 -> WildcardResolver#resolve
```

`dependency_tracker.rb` (3), `dependency_tracker/erb_tracker.rb` (13),
`dependency_tracker/wildcard_resolver.rb` (6) are all absent. This is why
fragment caching cannot currently expire correctly, and it is the largest
coherent unit in the slice.

## Design

### The default tracker needs no parser and no compiler

`dependency_tracker.rb:38` carries exactly one default registration:

```ruby
register_tracker :erb, ERBTracker
```

`ERBTracker` scans **template source with regexes** (`erb_tracker.rb:6-60`) —
`RENDER_ARGUMENTS`, `PARTIAL_HASH_KEY`, `VARIABLE_OR_METHOD_CHAIN`, and a
`StringScanner` loop for `#{}` interpolation. It never compiles the template and
never parses Ruby.

`RubyTracker` is the other shape — it calls `template.handler.call(template,
template.source)` to get compiled Ruby and hands that to
`RenderParser::Default`, which is Prism or Ripper. **Nothing in actionview
registers it.** It is opt-in surface for gems whose handlers compile to Ruby.

So the fidelity-correct default in trails is `TSETracker` — the `erb` -> `tse`
token rename applies, exactly as it already did for
`template/handlers/erb.rb` -> `handlers/tse.ts` — scanning `.tse` source with
translated regexes. **No JS parser, no TSE compilation, nothing extra in the
production dependency tree.** The path that actually runs for every trails
template is the path that needs the least machinery, and that is Rails' own
arrangement rather than a concession we are inventing.

### `RenderParser` is therefore deferred, not ported here

`RenderParser` is 3 files and 39 methods: `Base` (the two key arrays plus
`directory` / `partial_to_virtual_path`), `PrismRenderParser` (AST walk),
`RipperRenderParser` (350 lines of hand-rolled `Ripper::SexpBuilderPP`).

Two independent reasons to keep it out of this slice:

1. **It has no reader.** Only `RubyTracker` constructs it, and nothing registers
   `RubyTracker`. Shipping it now is an unread code path — the same reasoning
   that deliberately deferred `Resolver.caching` in
   `port-resolver-caching-and-cache-template-loading`.
2. **It would put a parser in the production dependency tree.** The compiled
   artifact in trails is JavaScript, so there is nothing to port literally;
   `Prism` and `Ripper` are Ruby-parser bindings with no counterpart. The port
   would have to walk a JS AST, and the parser to do it is a new runtime
   dependency of `actionview`.

When it is eventually built, two decisions are already settled and recorded here
so the future story does not re-derive them:

- **Use `acorn`, not the TypeScript compiler API.** `compileJs`
  (`packages/tse-compiler/src/emit-js.ts:110`) emits plain JS —
  `export default function render(context, locals)`, no type annotations — so
  TS-awareness buys nothing and costs ~8MB in the runtime tree. Load it behind a
  dynamic `import()` so a bundle that never registers `RubyTracker` drops it.
- **`ripper_render_parser.rb` is a deliberate non-port.** Its entire reason to
  exist is `render_parser.rb:30-38`'s `begin require "prism" rescue LoadError`
  fallback. trails has one parser and no fallback condition, so `Default` binds
  unconditionally and the 350-line Ripper subclass has nothing to mirror. It
  wants a `SKIP_GROUPS` entry with that reason, so its 33 methods stop counting
  as missing forever.

That skip is worth stating in method terms: of the 168 absent core methods, 33
are Ripper and 9 are `RubyTracker`. The slice this RFC actually ports is
**~126 absent methods plus 87 missing-in-ported**.

### Dev and prod differ in cache lifetime, never in extraction

Rails runs one extraction path in both environments. What changes is caching,
driven off `reloading_enabled?` in `actionview/lib/action_view/railtie.rb:89-123`:

- **prod** — `Resolver.caching = true` (`railtie.rb:92`); `finder.digest_cache`
  is written once behind the double-checked lock at `digestor.rb:26-34` and
  never invalidated. Tracking runs a handful of times and then never again.
- **dev** — caching off, and `CacheExpiry::ViewReloader` (`railtie.rb:116`)
  registers into `PathRegistry.file_system_resolver_hooks`, watches every
  resolver directory, and calls `LookupContext::DetailsKey.clear` on change.

**Two extraction paths would be a correctness bug, not an optimization.** The
tracker's output is a list of template paths that feeds fragment cache keys via
`Digestor.digest`. If dev and prod derived different dependency sets, a template
that correctly busts its cache in dev would silently serve stale fragments in
prod — invisible locally, reproducible only under the configuration that is
hardest to debug. Rails avoided this: `ERBTracker` and `RubyTracker` are a
legacy/modern pair registered **per handler**, not per environment, and a given
handler gets the same one everywhere.

The receiving end of the dev half already exists —
`lookup-context.ts:103,151-153` has `DetailsKey._digestCache` and `clear()`.
What is missing is `fileSystemResolverHooks` on `path-registry.ts` and the
`ViewReloader` itself.

### Precomputing digests at build time is a separate, already-filed question

Because prod never invalidates, every digest a prod app will compute is
determined by the template set at deploy time, so they could be computed by
`trails-tsc-views build` and used to warm `finder.digest_cache`. That seam is
narrow — `Digestor.digest`'s existing lock returns the cached value without
entering `tree`, so `DependencyTracker` is simply never reached, and an absent
or stale manifest falls back to computing.

This RFC does **not** own that. `decide-fate-of-the-unconsumed-aot-views-manifest`
(RFC 0104, ready, 90 loc) already owns the question of whether the AOT manifest
is consumed at runtime at all, and its second option — "wire a production-mode
resolver over the manifest, with an explicit `@noRailsEquivalent PERMANENT`
receipt and a benchmark" — is exactly this decision. A digest manifest is a
better-justified consumer than a template resolver, because it pre-populates a
cache Rails also populates lazily rather than replacing the rendering path. That
argument belongs in that story, and this RFC's job is to make the fallback path
correct first.

### Prior art: much of this slice is already filed elsewhere

Nine ready/draft stories already own parts of the rendering core. This RFC does
**not** re-own them and does not rehome them — rehoming requires the RFC to be
merged first, and the dependency edges below are enough to schedule around.

| Story                                                       | RFC  | Status         | Bearing                                                                                                        |
| ----------------------------------------------------------- | ---- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `actionview-digestor-is-a-stub-not-a-dependency-tree-digest` | 0123 | ready, 400 loc | **Owns the digest tree.** Its own text says `RenderParser` "may warrant its own story"; this RFC answers that. Depends on stories 1-2 here. |
| `port-resolver-caching-and-cache-template-loading`           | 0104 | ready          | Owns `Resolver.caching` + `Base.cacheTemplateLoading` + the trailtie initializer. `cache-expiry-view-reloader` depends on it. |
| `decide-fate-of-the-unconsumed-aot-views-manifest`           | 0104 | ready, 90 loc  | Owns the build-time digest question above.                                                                     |
| `port-unbound-template-for-resolver-binding`                 | 0104 | ready, 140 loc | Owns `unbound_template.rb` (11 methods). Excluded here.                                                         |
| `port-template-sources-file-for-lazy-resolver-sources`       | 0104 | ready          | Owns `template/sources/file.rb` (2). Excluded here.                                                             |
| `port-html-builder-and-ruby-template-handlers`               | 0104 | ready, 120 loc | Owns `handlers/builder.rb` (5) + `handlers/html.rb` (1). The likely first reader of `RubyTracker`.              |
| `back-template-types-with-the-mime-registry`                 | 0104 | ready, 200 loc | Owns `template/types.rb` (6 missing).                                                                           |
| `template-error-backtrace-locations`                         | 0104 | ready, 120 loc | Owns part of `template/error.rb` (13 missing).                                                                  |
| `rails-test-name-parity-rollout-actionview`                  | 0127 | draft          | Adjacent to `enroll-actionview-in-parity-test`; that story must not duplicate it.                              |

## Non-goals

- **`helpers/**`** — 29 absent files, 94 absent methods, 77 missing-in-ported.
  Form builders, tags, dates, assets, atom feeds. Its own campaign, sized
  honestly, after this.
- **`RenderParser` and `RubyTracker`** — deferred to
  `render-parser-and-ruby-tracker-when-a-handler-needs-them`, filed here as a
  draft gated on a registered reader.
- **Build-time digest precomputation** — owned by RFC 0104's AOT manifest story.
- **Enrolling actionview in the extra-surface or param-name gates.** Those are
  RFC 0120's and RFC 0128's calls to make.

## Alternatives considered

- **Walk `TseAst` fragments instead of porting `ERBTracker`'s regexes.** The
  fragments are already isolated, so it looks cheaper. But `TseAst` node values
  are raw JS source strings, so a scanner is still needed — and building it over
  our own AST rather than the template source diverges from the file
  `parity:api` is comparing against, for no reduction in work.
- **Port `RenderParser` now against the TypeScript compiler API.** Rejected on
  both counts above: no reader, and a parser in the production tree. Recorded in
  Design so the future story inherits the reasoning rather than re-litigating it.
- **Two extraction paths, source in dev and compiled in prod.** Rejected in
  Design — divergent dependency sets across environments is a stale-fragment bug
  with the worst possible reproduction story.
- **Port the whole of actionview in one campaign.** The helper half is ~171
  methods of independent surface with no actionpack consumer; carrying it would
  roughly double the slice and delay actionpack for no gain.

## Rollout

1. Tracking substrate — `dependency-tracker-and-wildcard-resolver`,
   `tse-tracker-ports-the-erb-regex-tracker`
2. Digest tree — RFC 0123's `actionview-digestor-is-a-stub-...` (not owned here)
3. Dev invalidation — `cache-expiry-view-reloader`
4. Template representation — `template-text-html-and-raw-file-classes`,
   `actionview-context-and-record-identifier`, `collection-caching-for-partial-renderer`
5. Peripherals — `actionview-log-subscriber`, `routing-url-for-includes-url-for`
6. Measurement — `enroll-actionview-in-parity-test`

## Verification

- `pnpm parity:api --package actionview` shows every file named in the Rollout
  at 100%, and the package's method figure rises from 495/921 to roughly
  708/921 (76.9%) once RFC 0123's digestor story and the RFC 0104 stories above
  land alongside.
- `dependency_tracker.rb`, `dependency_tracker/erb_tracker.rb` and
  `dependency_tracker/wildcard_resolver.rb` report 0 missing.
- `pnpm parity:api:extra --package actionview` lists no new name from these
  stories without a receipt.
- `pnpm parity:test --package actionview` reports a figure at all — it currently
  reports none, because actionview is absent from the compared population.
- `render_parser/ripper_render_parser.rb` carries a `SKIP_GROUPS` entry with its
  reason and no longer counts as 33 missing methods.
- No new runtime dependency appears in `packages/actionview/package.json`.

## Open questions

1. **Does `TSETracker`'s regex set need the `:partial =>` hash-rocket arm?**
   `PARTIAL_HASH_KEY` matches both Ruby hash syntaxes; trails kwargs are object
   literals with one spelling. The arm has no TS counterpart and should drop,
   but the exact regex translation is the substance of that story, not a
   decision to pre-empt here.
2. **Which `Template` does `TSETracker` receive in trails?** Rails' tracker
   reads `template.source`; trails' `Template` memoizes its compile
   (`memoize-tse-compile-on-the-template`, done). The tracker must read source,
   not the memoized compile, and the story pins that with a test.

## Changelog

- 2026-09-08: initial RFC
