---
rfc: "0000-small-gem-ports-parity-100"
title: "Small non-Rails gem ports back to 100% parity"
status: draft
created: 2026-10-15
updated: 2026-10-15
owner: "@deanmarano"
packages:
  - rack
  - rack-session
  - rack-test
  - globalid
  - i18n
  - bcrypt
  - did-you-mean
clusters:
  - rack-api
  - rack-calls
  - rack-extra
  - rack-tests
  - rack-session
  - small-residuals
  - comparer
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Small non-Rails gem ports back to 100% parity

## Summary

trails ports several gems that are not part of the Rails repo but sit in its
dependency closure: `rack`, `rack-session`, `rack-test`, `globalid`, `i18n`,
`bcrypt` and `did-you-mean`. Each is measured against its own vendored
upstream (`vendor/<gem>/<version>/`). Most of them have dropped below 100% on
one or more parity dimensions: some through real drift, some because the
parity tooling now measures things it did not measure when the package
reached 100%. This RFC records where each package stands as of trails
`31c40b1da4` (2026-10-15). It files one story per package, or per package and
gate where the work is large, to bring every one back to 100% by converging
the port. It never widens a baseline.

`ruby-compat` and `msgpack` are excluded. Each has its own RFC
(`0154-ruby-compat-surfaced-deviations` and `0184-msgpack-gem-port`).

## Motivation

The numbers below come from a forced run on trails `main` @ `31c40b1da4`:
`API_COMPARE_FORCE=1 pnpm parity:api --calls`, `pnpm parity:test`,
`pnpm parity:test --assertions`, `pnpm parity:api:extra --package <pkg>`, and
every gate (`parity:api:calls`, `:calls:args`, `:params`, `:extra:gate`,
`:predicates`).

**Every gate is green.** These packages are either baselined (call rows) or
not enrolled (naming args, extra surface, assertions). So every gap below is
debt that one of the registers already carries, plus a few gaps that no
register carries. None of them is a red build. "Calls" and "args" are the raw
mismatch counts in `output/call-mismatches.json` /
`output/call-arg-mismatches.json`. "(b N)" is the number of rows baselined in
`call-mismatches-exclude/`.

| Package      | API methods   | Files | Inherit. | Arity   | Calls (b) | Args (b)    | Params | Extra (novel/moved) | Pins  | Tests               |
| ------------ | ------------- | ----- | -------- | ------- | --------- | ----------- | ------ | ------------------- | ----- | ------------------- |
| rack         | 539/584 92.3% | 45/46 | 41/43    | 333/337 | 40 (b 38) | 26 (b 8)    | 100%   | 37 / 69 (106)       | 2 un  | 775/872 88.9%       |
| rack-session | 69/98 70.4%   | 2/4   | 2/2      | 100%    | 2 (b 2)   | 1 (naming)  | 100%   | 0 / 0               | 0     | 58/124 46.8% (66 s) |
| rack-test    | 105/108 97.2% | 5/5   | 3/3      | 100%    | 1 (b 1)   | 4 (naming)  | 100%   | 0 / 0               | 3 un  | 229/234 97.9%       |
| globalid     | 89/91 97.8%   | 7/7   | 3/5      | 100%    | 2 (b 2)   | 1 (receipt) | 100%   | 4 / 4               | 1 un  | 131/138 94.9%       |
| i18n         | 287/289 99.3% | 17/17 | 9/9      | 100%    | 0         | 6 (b 2)     | 100%   | 0 / 12              | 0     | 307/307 100%        |
| bcrypt       | 18/18 100%    | 2/2   | 3/3      | 100%    | 0         | 1 (naming)  | 100%   | 0 / 0               | 13 un | 39/39 100%          |
| did-you-mean | 8/8 100%      | 4/4   | 2/2      | 100%    | 0         | 0           | 100%   | 0 / 2               | 2 un  | 6/6 100%            |
| date         | not measured  | —     | —        | —       | —         | —           | —      | 0 / 0               | —     | 137/137 100%        |

The rack test row also reports 329 assertion-count, 433 assertion-kind and 49
assertion-value mismatches (`parity:test --assertions`, report-only), plus 76
TS-only extra tests.

### Which script change moved which number

Each gap is classed as either a **new measurement**, where a tooling change
started counting something already wrong, or **drift**, where the port moved
or was never finished.

- **rack `spec_request.rb` 97/194 (new measurement).** This is the 97-test
  drop in rack's test figure. trails#8881 (`9b799b6319`, 2026-10-13,
  "test-compare credits inherited tests") taught
  `scripts/test-compare/extract-ruby-tests.rb` to credit tests a same-file
  subclass inherits. `class TestProxyRequest < RackRequestTest`
  (`vendor/rack/v3.1.14/test/spec_request.rb:1922`) re-runs all 97
  `RackRequestTest` examples against a proxied request, and the TS suite runs
  them once. It is a real gap, and the comparer is right. It is already filed
  as `port-rack-spec-request-test-proxy-request-inherited-examples`
  (0141-actionpack-surfaced-deviations); this RFC references it rather than
  duplicating it.
- **Call rows (drift, seeded by a gate).** Every rack, rack-session, globalid
  and i18n exclude shard was created by `6fd876d288` (2026-08-05, the RFC 0047
  wide call-set ratchet) or by the package's own port PR. The rows are
  original debt, not a recent regression. Later script changes (trails#8775 /
  trails#8782 native hash forms, trails#8805 "self.new is the constructor")
  re-keyed some rows (`new → constructor`, `fetch`, `delete`, `has_key?`) but
  added none.
- **Call-args naming rows (new measurement, report-only).** These are RFC
  0153's `naming` dimension. `NAMING_ENROLLED_PACKAGES` in
  `scripts/api-compare/lint-call-args.ts` gates `date`, `globalid` and
  `i18n`, and these are already clean or receipted. In rack (18 of 26),
  rack-test (4), rack-session (1) and bcrypt (1) the rows are report-only and
  have never been burnt down. The 8 rack `shape` rows date from RFC 0095's
  seed.
- **Extra surface (measured, never gated).** RFC 0117's
  `extra-surface-mark.json` gates only `ruby-compat`, `thor`, `activemodel`,
  `activerecord` and `arel`. None of these packages is gated, so their extras
  have accumulated since each port. `burn-down-and-enroll-globalid` and
  `burn-down-and-enroll-i18n` (0120) already exist for two of them.
- **API misses (drift).** `Rack::Reloader` (no file), most of `Rack::Events`
  and `Rack::Lint::Wrapper`, `Rack::Session::Cookie` and
  `Rack::Session::Encryptor` (no files), and `Rack::Test::Methods`' alias and
  accessor have been unported since each package landed. No script change
  moved them.
- **Body pins (drift).** `bcrypt` 0/13 and `did-you-mean` 6/8 were never
  pinned. rack, rack-test and globalid each have a handful unpinned after
  later edits.

## Design

One story per package, split by gate where a package's residue would not fit
one PR. Every story's acceptance criterion is the package reporting 100% on
the named gate or dimension. A story may close a gap only by converging the
TS onto the upstream Ruby. It must not baseline, broaden a reason, or move a
row to another register, per trails CLAUDE.md § "A documented deviation is
debt, not permission". Where an existing story already owns a gap, the
package story lists it as a `deps` edge or names it in Context, and does not
re-file it.

Gaps that turn out to be comparer false positives are filed against the
script, not the package. One is suspected now:
`[Symbol.iterator]`, `[Symbol.hasInstance]` and `[Symbol.for("[]")]` are
scored as novel public extra surface in rack (`files.ts`, `query-parser.ts`,
`response.ts`). trails CLAUDE.md § "Ruby protocol methods with a different JS
mechanism" sanctions `Symbol.hasInstance` as the port of `is_a?`, and
§ "Module mixins" treats symbol-keyed members as not public string-named
surface. See `extra-surface-skips-well-known-symbol-keyed-members`. If a
story finds another comparer false positive, it files a new script story
under this RFC instead of receipting the package.

## Non-goals

- **ruby-compat and msgpack.** Each has its own RFC
  (`0154-ruby-compat-surfaced-deviations`, `0184-msgpack-gem-port`).
- **`date` API parity.** `date` is `compareApi: false` in
  `vendor/sources.ts`, because Ruby's `Date`/`DateTime` surface lives in C
  (`ext/date/date_core.c`) and the extractor has nothing to read
  (`scripts/api-compare/config.ts`, `PACKAGES_OUTSIDE_MANIFEST`). Its test
  parity is 137/137, so nothing is filed.
- **Packages with no vendored upstream.** `html-sanitizer`, `nokogiri`,
  `tse-compiler`, `trails-tsc`, `activerecord-cli` and `website` have no gem
  in `vendor/`, so no parity tool measures them and "100%" is undefined.
  Vendoring `rails-html-sanitizer` / `loofah` / `nokogiri` to measure them
  would be its own RFC.
- **Gems scored inside another package.** `thor`, `sqlite3`, `pg` and
  `mysql2` are measured as their own manifest packages, but their TS lives in
  `trailties` and `activerecord` and each has its own RFC (0185/0186/0187 and
  the trailties surfaced-deviations bucket).
- **Gating these packages in `parity:api:extra:gate` or
  `NAMING_ENROLLED_PACKAGES`.** Enrolling a package is the last criterion of
  the story that burns its surface to zero. It is not a separate decision
  this RFC pre-commits.

## Alternatives considered

- **One story per gate across all packages.** This was rejected because the
  convergence work is per file, and a cross-package story would touch seven
  packages' files in one PR and collide with sibling agents.
- **Re-baselining the inherited-test drop as "Ruby-only re-run".** This was
  rejected: the proxy re-run exercises real `Rack::Request` delegation, and a
  baseline would be the widening CLAUDE.md forbids.

## Rollout

1. Comparer fixes first, so package stories measure true residue:
   `extra-surface-skips-well-known-symbol-keyed-members`.
2. rack API: `rack-port-reloader`, `rack-converge-events`,
   `rack-port-lint-wrapper-checks`, `rack-api-residual-members-inheritance-arity`.
3. rack calls and args: `rack-call-rows-burndown-builder-through-multipart`,
   `rack-call-rows-burndown-request-through-utils`,
   `rack-call-args-shape-and-naming-to-zero`.
4. rack extra surface: `rack-headers-extra-surface-to-zero`,
   `rack-extra-surface-outside-headers-to-zero`.
5. rack tests: `rack-spec-request-and-multipart-take-rails-bodies`,
   `rack-spec-headers-response-utils-lint-take-rails-bodies`,
   `rack-remaining-specs-take-rails-bodies`. The existing
   `port-rack-spec-request-test-proxy-request-inherited-examples` story is a
   `deps` edge of the first.
6. rack-session: `rack-session-port-encryptor`, `rack-session-port-cookie`,
   `rack-session-residual-pool-and-abstract-id`.
7. Small residuals: `rack-test-parity-residual`, `globalid-parity-residual`,
   `i18n-parity-residual`, `bcrypt-and-did-you-mean-parity-residual`.

## Verification

On a forced `API_COMPARE_FORCE=1 pnpm parity:api --calls` plus
`pnpm parity:test`, each of rack, rack-session, rack-test, globalid, i18n,
bcrypt and did-you-mean reports:

- methods, files, inheritance, arity and params at 100%, with pins 0
  unpinned;
- 0 rows in `call-mismatches.json` and `call-arg-mismatches.json`, and no
  shard left under `call-mismatches-exclude/<pkg>/`;
- 0 novel and 0 moved in `parity:api:extra --package <pkg>`;
- 100% matched tests, with 0 assertion-count, assertion-kind and
  assertion-value mismatches and 0 TS-only extras in Rails-named files.

The exceptions are skips carrying a `PERMANENT-SKIP:` line that cites a
ratified CLAUDE.md section. A skip with no such citation counts as a gap.

## Open questions

1. **Does this RFC reverse 0133's non-goal on `Rack::Session::Cookie` /
   `Encryptor`?** `0133-rack-session-gem-port` § Non-goals says they are
   "ported only if a call site appears", because Rails' `CookieStore`
   subclasses `AbstractSecureStore`. At 100% parity they must be ported
   (28 methods, 64 skipped tests). **Resolved 2026-10-15 by the repo owner:
   yes, port both.** The gem port is the unit of parity; this RFC supersedes
   that 0133 non-goal.
2. **rack assertion-kind counts.** The 433 kind mismatches are report-only.
   The three test-body stories treat them as real until a story finds a
   comparer mapping gap, in which case it files a script story here.

## Changelog

- 2026-10-15: initial RFC
