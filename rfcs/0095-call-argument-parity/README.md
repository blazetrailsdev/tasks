---
rfc: "0095-call-argument-parity"
title: "Call-argument parity (api:calls:args)"
status: active
created: 2026-08-09
updated: 2026-08-09
owner: "@deanmarano"
packages:
  - "activerecord"
  - "arel"
clusters:
  - "api-compare"
related-rfcs:
  - "0025"
  - "0047"
  - "0084"
---

# RFC 0095 — Call-argument parity (`api:calls:args`)

## Summary

Add a fourth api:compare fidelity dimension: for every name-matched (Ruby, TS)
method pair, compare the **arguments** each body passes to the calls it makes,
after camelizing identifiers and symbol keys. Today `api:calls` compares the
**set of call names** only — a port can call `where` where Rails calls `where`,
pass a completely different argument list, and every gate in the repo stays
green.

Chartered from a spike (2026-08-08, originally written up under RFC 0025;
see Provenance). The spike prototyped both extractors and the comparator far
enough to measure real populations: **77% genuine divergence over 102
hand-classified rows**, and it found a 23-call-site parameter-order divergence
in arel that no existing gate could see.

## Motivation

RFC 0084's defect-shape table lists what the call-set gate can and cannot
detect. Three of its "blind" rows are argument-shaped:

| Defect shape                                           | `api:calls` |
| ------------------------------------------------------ | ----------- |
| Missing call to a ported method                        | visible     |
| **Wrong values / literals**                            | **blind**   |
| **Invented / extra behavior Rails does not have**      | **blind**   |
| Wrong return value or semantics of a call that IS made | blind       |

The concrete proof, and the finding that chartered this RFC: trails moved the
`collector` parameter to the **last** position across the entire arel visitor-
helper family. Rails `inject_join(list, collector, join_str)`
(`to_sql.rb:897`) is `injectJoin(list, joinStr, collector)`
(`to-sql.ts:1721`); same for `collect_nodes_for` (`:179`), `infix_value`
(`:957`), `infix_value_with_paren` (`:963`), `grouping_parentheses` (`:981`).
23 flagged call sites from one cause — a third of arel's entire flagged
population, and a direct CLAUDE.md violation ("Same parameter _order_ and
defaults").

Nothing caught it. `arity.ts` compares declaration-site parameter **counts**,
which match exactly. `api:compare` compares **names**, which match.
`api:calls` compares the **call set**, and every call is made. Only an
argument-level comparison surfaces it. That convergence is already filed
(`0084/converge-arel-visitor-helper-collector-parameter-position`) and does not
wait on this RFC.

## Design

### Extraction

Both extractors already reach the argument nodes and discard them.

**Ruby** — `walk_for_calls` (`extract-ruby-api.rb:2291`) visits every
`:fcall` / `:vcall` / `:call` / `:command` / `:command_call` / `:super` node.
The argument node is a sibling in hand at each: `node[2]` for `:command` and
`:method_add_arg`, `node[4]` for `:command_call`, `node[1]` for `:super`.

**TypeScript** — `collectCalls` (`extract-ts-api.ts:2698`) already calls
`call.arguments.forEach(visit)`.

Descriptor grammar, and what is out of reach:

| Argument form                            | Extractable                      | Descriptor                   |
| ---------------------------------------- | -------------------------------- | ---------------------------- |
| Bare identifier / ivar                   | yes                              | `id:<name>`                  |
| Numeric / string / boolean / nil literal | yes                              | `num:` `str:` `bool:` `nil`  |
| Symbol                                   | yes                              | `sym:<name>`                 |
| Constant                                 | yes                              | `const:<short>`              |
| Nested call                              | yes, name only                   | `call:<name>`                |
| Keyword args / trailing hash             | yes, keys + value descriptors    | `kwargs{k=<desc>,…}`         |
| `new` expression                         | yes                              | `call:constructor`           |
| Array / hash literal contents            | **no** (opaque)                  | `array` / `hash` — skip      |
| String interpolation                     | **no**                           | `str-interp` — skip          |
| Splat / double-splat / block-pass        | **no** (arity unknown)           | flag, skip the site          |
| Block                                    | **no**                           | flag; compare non-block args |
| Binary / unary / ternary                 | **no** (language-specific shape) | skip                         |

Two structural Ripper limits, both permanent:

- **A local read is indistinguishable from a zero-arg self-send.** So `id:x`
  and `call:x` must collapse into one `ref:x` bucket on both sides — the same
  information loss `inert_receiver?` (`extract-ruby-api.rb:2280-2288`) already
  works around for the weak-call set.
- **Local aliasing is invisible.** `attr, values = o.left, o.right` then
  `visit(attr, collector)` reads as `ref:attr` against the port's `ref:left`.
  Confirmed equivalents that cost real rows.

One TS-side subtlety: `collectCalls` deliberately credits a bare property
**read** (`this.joinsValues`) as a call, because Ruby has no field access.
Those are not call sites and carry no argument list. The args stream must
record syntactic call sites only, so the comparator can distinguish "no
comparable TS site" from "called with zero arguments" — conflating them
manufactures false rows.

### Normalization

Through the same pipeline names already flow (`snakeToCamel`, cf.
`options-keys.ts:24` and `literals.ts:105`):

- Identifiers and nested call names camelize; Ruby `new` → `constructor`.
- Symbols → the JS string spelling, and the colon-kept spelling (`":dump"`,
  CLAUDE.md "Symbols vs strings") compares **equal** to the bare one.
- Identifier-shaped strings (`/^[a-z][A-Za-z0-9_]*$/`) camelize; everything
  else compares byte-for-byte. **Load-bearing**: camelizing SQL fragments
  (`" GROUP BY "`) would destroy the dimension's sharpest finding.
- Literal values reuse `literals.ts` `normalizeLiteral`.

Ignored, because the two languages cannot agree:

- Splat / double-splat / block-pass on either side.
- Any argument list containing an opaque descriptor — **including one nested
  inside a `kwargs{}`**. The spike measured that leak at 8 of 17 noise rows and
  94 of 604 activerecord rows.
- `super`, every `NO_JS_CALL_FORM` name (`compare.ts:195`), and the
  Enumerable/Object idiom denylist — exactly as the call-set gate excludes them.
- A leading `this`-mixin receiver argument the port adds
  (`deleteThroughRecords(this, records)` for `delete_through_records(records)`).
  That is the settled `this`-typed-function idiom, not a divergence.

### Measured signal

Prototype: a Ripper walker plus a `typescript` AST walker, paired through the
name-matched pairs in `output/call-skeletons.json`.

| Package      | Pairs resolved | Comparable Ruby sites |     Match | **Flag** |
| ------------ | -------------: | --------------------: | --------: | -------: |
| arel         |            301 |                   302 | 232 (77%) |   **70** |
| activerecord |          2,279 |                 1,294 | 784 (61%) |  **510** |

Hand classification — arel is the **full** population (n=70), activerecord a
seeded random sample (n=40, less 8 eliminated by the nested-`?` fix → n=32):

| Bucket                              | arel (n=70) | activerecord (n=32) | Combined (n=102) |
| ----------------------------------- | ----------: | ------------------: | ---------------: |
| (a) genuine divergence worth fixing |    57 (81%) |            22 (69%) |     **79 (77%)** |
| (b) confirmed equivalent            |      6 (9%) |              1 (3%) |           7 (7%) |
| (c) tooling noise                   |     7 (10%) |             9 (28%) |         16 (16%) |

The genuine bucket splits three ways:

- **a1 — argument order / dropped defaults (33% of arel rows).** The arel
  collector family above.
- **a2 — local/parameter identifier renamed away from Rails (33% arel / 31% AR).**
  `o`→`node`, `x`→`n`, `v`→`h`, `join_name`→`tbl`, `scope_for_association`→`sfa`.
  Real, but the local-identifier dimension surfacing here; see
  `call-args-naming-dimension-disposition`.
- **a3 — invented helper or conversion at the call site (16% arel / 13% AR).**
  `appendEscape` (`to-sql.ts:1044`) is an extracted helper Rails does not have
  (`to_sql.rb:485-495`); `quoteTableName(rubyToS(name))` adds a conversion
  Rails' `quote_table_name(name)` does not do; `UnaryOperation.operand`
  (`unary-operation.ts:19`) shadows Rails' `Unary#expr` (`unary.rb:6`); Rails
  `assert_valid_value(object, action: :dump)` flattened to `(object, "dump")`.

Residual noise (16%) is Ruby local aliasing, block-variable identity through a
restructured loop, dynamic `send`, and hoisted temporaries. All
false-positive-shaped: they belong in the baseline with a reason, not in a
normalization rule.

**The activerecord 69% rests on a 32-row sample, not the full 510.** The
baseline-seed story re-measures at scale.

## Rollout

Two row classes in one artifact; gate one:

- **`shape`** — argument count, order, literal values, kwarg keys (a1 + a3).
  **Gated.** ~45% of flagged rows, and the part nothing else measures.
- **`naming`** — lists differing only in a `ref:` identifier spelling (a2).
  **Report-only.** ~33% of the population; gating it on day one buys a ~500-row
  baseline that would swamp the rows carrying the unique findings.

Ratchet shape: **its own baseline tree and its own script.**
`scripts/api-compare/call-mismatches-args-exclude/`, sharded per file, keyed
`package + tsFile + rubyName + call + rubyArgs`. It must **not** fold into
`call-mismatches-exclude`: that key has no argument component, and RFC 0084
measures its row count as the debt metric — mixing a second dimension in
corrupts that measurement.

Advisory first, matching every prior tool in this repo: land the artifact and
`--report` with no gate, seed the baseline in a `main`-only PR, then flip to
gating.

Story order — the two extractors are parallel, everything after is a chain:

1. `ruby-extractor-emit-call-arguments` ∥ `ts-extractor-emit-call-arguments`
2. `call-args-normalize-and-compare`
3. `call-args-artifact-and-report`
4. `call-args-ratchet-and-ci-step`
5. `call-args-baseline-seed`
6. `call-args-naming-dimension-disposition` (decision, after 3)

~1,050 LOC of hand-written code plus one generated baseline.

**Cache invalidation differs per side and is easy to get backwards.**
`extractor-schema.ts` governs the **TS** extractor cache only
(`EXTRACTOR_SOURCES`, `extractor-schema.ts:91`), so `callArgs` is registered in
`EXTRACTOR_OUTPUT_FIELDS` by the **TS** story alone. The Ruby manifest keys on
the content hash of `extract-ruby-api.rb` itself (`orchestrate.ts:88-99`) and
self-invalidates. One registration, one story — the two extractor stories share
no edit and stay parallel-safe.

## Non-goals

- **Not a reuse of `arity.ts`.** That dimension checks `def` signatures
  (declaration-site parameter counts), not call sites, and `arity-exclude.json`
  is keyed by method, not by call. It is why the arel finding was invisible.
- **Not a widening of the call-set baseline.** RFC 0084's row count is its debt
  metric and stays untouched.
- **Not the local-identifier campaign.** The `naming` class is measured and
  reported here; whether it becomes a burndown is decided by its own story.
- **No gate on day one.**

## Provenance

Spiked 2026-08-08 in the trails worktree `api-calls-args-spike-892491`; no
trails code was written. The findings were first written up as a
`## Call-argument fidelity` section in RFC 0025 (fidelity-verification-tooling)
and moved here on 2026-08-09, because 0025 is `postponed` and
`ready()` (`cli.ts:425`) excludes stories under any non-active RFC — parking
this campaign there made all seven stories unreachable. RFC 0025 retains a
pointer.
