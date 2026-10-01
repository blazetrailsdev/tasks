---
rfc: "0176-actionview-helpers"
title: "ActionView helpers — the helper half to parity"
status: draft
created: 2026-10-01
updated: 2026-10-01
owner: "@deanmarano"
packages:
  - "actionview"
  - "activesupport"
  - "activemodel"
  - "activerecord"
  - "actionpack"
  - "trailties"
  - "nokogiri"
  - "ruby-compat"
clusters: []
related-rfcs:
  - "0140-actionview-rendering-core"
  - "0141-actionpack-surfaced-deviations"
  - "0160-actionpack-test-harness-parity"
  - "0170-psych-in-ruby-compat"
---

# RFC 0176 — ActionView helpers

## Summary

Port the **helper** half of ActionView: `action_view/helpers/**` and the
`ActionView::Helpers` umbrella, plus the test support those suites lean on.
RFC 0140 ports the non-helper half and names `helpers/**` as its first
non-goal, "its own campaign, sized honestly, after this". This RFC is that
campaign's home.

It is filed as a **draft**. It exists first to house helper stories that were
being filed into RFC 0140 for want of anywhere else, and it is not yet
decomposed: the gap list below is a measurement, not a story list.

## Motivation

### RFC 0140 was carrying a second campaign

At the 2026-10-01 refine, RFC 0140 held 173 stories. Sorted by what they port:

| Slice                                                      | Stories | Open |
| ---------------------------------------------------------- | ------- | ---- |
| Rendering core, TSE compiler, layouts (0140's stated goal) | 119     | 4    |
| `helpers/**` and helper test support                       | 41      | 4    |
| `trails-tsc` view typing                                   | 13      | 6    |

Roughly a quarter of the RFC was helper work that its own Non-goals section
excludes: the asset tag and asset URL helpers, `url_helper`, `tag_helper`,
`form_with` / `form_for` / `fields_for`, the `Tags::*` text-field family, and
making the helper files live `Module`s. That work was real and is done; it
stays recorded in 0140 because only open stories move. What moves here is the
open remainder, so that 0140 can close on the goal it declared.

### Measured state, 2026-10-01

`pnpm parity:api --package actionview --files` at trails `8f2186e9db` reports
actionview at **1173/1479 methods (79.3%)**, 80 of 96 files. (Measured with
`API_COMPARE_ALLOW_STALE_BUILD=1` from a checkout whose `dist` was stale, so
the totals are indicative. Re-measuring from a fresh build is the first step of
Rollout phase 1.)

The helper rows that are not at 100%:

| Rails file                           | Matched | Missing |
| ------------------------------------ | ------- | ------- |
| `helpers/date_helper.rb`             | 21      | 41      |
| `helpers/form_helper.rb`             | 154     | 37      |
| `helpers/form_tag_helper.rb`         | 82      | 30      |
| `helpers/tags/base.rb`               | 99      | 30      |
| `helpers/tags/collection_helpers.rb` | 0       | 12      |
| `helpers/controller_helper.rb`       | 2       | 10      |
| `helpers/tags/date_select.rb`        | 0       | 9       |
| `helpers/atom_feed_helper.rb`        | 0       | 5       |
| `helpers/tags/check_box.rb`          | 0       | 5       |
| `helpers/tags/radio_button.rb`       | 0       | 4       |
| `helpers/tags/select_renderer.rb`    | 0       | 3       |
| `helpers/csrf_helper.rb`             | 0       | 2       |
| `helpers/tags/file_field.rb`         | 0       | 2       |
| `helpers/csp_helper.rb`              | 0       | 1       |
| `helpers/tags/checkable.rb`          | 0       | 1       |

That is 192 missing methods in compared helper files. Every other compared
helper file is at 100%.

### The exclusion register hides more, and two of its helper entries are stale

`scripts/parity/unported-files/actionview.ts` removes these helper files from
the comparison entirely, so they appear in no row above:

- `helpers/form_options_helper.rb`
- `helpers/translation_helper.rb`
- `helpers/tags/select.rb`, `collection_select.rb`,
  `grouped_collection_select.rb`, `collection_check_boxes.rb`,
  `collection_radio_buttons.rb`, `time_zone_select.rb`, `weekday_select.rb`
- `helpers.rb`
- `helpers/asset_tag_helper.rb`

The last two are excluded for reasons that are no longer true.
`packages/actionview/src/helpers.ts` is a port of `helpers.rb`, and
`packages/actionview/src/helpers/asset-tag-helper.ts` is a port of
`asset_tag_helper.rb`, yet the register still says "nothing under it is
ported" and "no trails view layer". Until those entries are removed the
headline figure neither credits nor checks either file.

(The register's `/layouts.rb` entry is stale in the same way, since
`packages/actionview/src/layouts.ts` exists. Layouts are RFC 0140's scope, so
that entry is not counted here. No 0140 story covers it yet; the 2026-10-01
refine report flags it for filing there.)

The other entries share `FORM_HELPER_REASON`, "trails ports no view layer",
which stopped being true when `form_helper.rb` reached 81%. Removing them is
what turns the select and collection helpers into counted debt.

Removing entries **lowers the headline figure before it raises it**, because
hidden files become counted. By `def` count in the Rails source, the nine
genuinely unported files add about 49 methods to the missing column
(`form_options_helper.rb` alone is 27), and the two stale entries add about 16
that should mostly match on arrival. So the working baseline is roughly
**192 + 49 = 241 missing helper methods**, to be replaced by the measured
figure in phase 1.

### Unported Rails test files

`actionview/test/template/` files with no trails counterpart:
`atom_feed_helper_test.rb`, `csp_helper_test.rb`, `csrf_helper_test.rb`,
`date_helper_i18n_test.rb`, `form_collections_helper_test.rb`,
`form_options_helper_test.rb`, `form_options_helper_i18n_test.rb`,
`translation_helper_test.rb`. `form_helper_test.rb` is partly ported: its
`form_for` / `fields_for` block (lines 1599-4140, 168 tests) is the subject of
`port-form-helper-test-form-for-and-fields-for-suite`.

## Design

Nothing here needs a design the Rails source does not already give. Three
constraints carry over from the work done under RFC 0140:

- **Helper files are live `Module`s.** `actionview-helper-modules-as-live-modules`
  set the shape; nine files are still ES module namespaces flattened onto
  `Helpers`, and `actionview-remaining-helper-namespaces-as-live-modules`
  finishes it. New helper files are written as Modules with their Rails
  includes in Rails' order from the start.
- **`Tags::*` classes are one file per Rails file.** The text-field family
  landed that way in trails#8249; `CheckBox`, `RadioButton`, `FileField`,
  `Checkable`, the select and collection tags follow the same layout.
- **Helper suites assert through `assert_dom_equal`.** Seven ported suites
  already do. The comparison is a regex tokenizer until `@blazetrails/nokogiri`
  can parse HTML4, which is why
  `dom-assertions-fragment-parses-with-nokogiri-html4` lives here.

## Stories

This RFC files no new stories. The seven below were rehomed by
`pnpm tasks rehome ... --to 0176-actionview-helpers` on tasks `main` on
2026-10-01, after this RFC was merged and numbered (`ca549f1bf`,
`283a05198`, `06aafd5ec`).

| Story                                                            | From | Status before the move |
| ---------------------------------------------------------------- | ---- | ---------------------- |
| `actionview-remaining-helper-namespaces-as-live-modules`         | 0140 | ready                  |
| `form-builder-nested-attributes-probe-misses-ar-writer-spelling` | 0140 | ready                  |
| `port-form-helper-test-form-for-and-fields-for-suite`            | 0140 | ready                  |
| `dom-assertions-fragment-parses-with-nokogiri-html4`             | 0140 | blocked                |
| `port-action-view-csp-helper`                                    | 0141 | draft                  |
| `port-action-view-csrf-helper-and-generated-layout-meta-tags`    | 0141 | draft                  |
| `move-number-with-delimiter-to-actionview`                       | 0023 | draft                  |

**The draft gate applies to all seven, with no exemption.** A story under a
non-active RFC never surfaces in the ready queue, so the three that are `ready`
in RFC 0140 stopped being claimable when they moved, and stay that way until
this RFC is flipped to `active`. That is intended: the owner asked for a draft
home, and activation is the owner's call. Two of the three
(`actionview-remaining-helper-namespaces-as-live-modules`,
`form-builder-nested-attributes-probe-misses-ar-writer-spelling`) depend on
nothing unfiled, so the cost of the gate is exactly those two stories waiting.

**What this does for RFC 0140.** After the move 0140 holds no open helper
story. It still cannot close: three rendering-core stories are blocked
(`render-parser-and-ruby-tracker-when-a-handler-needs-them`,
`template-spot-spans-the-failing-node`,
`tse-handler-ports-erb-encoding-tag-and-valid-encoding`) and seven `tse` /
`trails-tsc` stories are open. The move makes 0140's open set match its stated
goal; it does not finish it.

Helper stories deliberately left where they are, because their parent RFC owns
the reason they exist:

- `debug-helper-through-object-to-yaml` (0170) depends on that RFC's Psych
  stories.
- `word-wrap-drops-ruby-chomp-bang-nil-return` (0082) is an instance of that
  RFC's bang-idiom class.

## Gaps with no story yet

Recorded so decomposition does not re-derive them. Each needs a story before
this RFC goes active.

1. **`Tags::CheckBox`, `RadioButton`, `FileField`, `Checkable`** and the
   `FormHelper#checkbox` / `#radio_button` / `#file_field` methods that
   construct them. `port-form-helper-tags-remaining-field-types` (0140) was
   closed as "folded into trails#8249", but that PR's description says these
   three "are not included". The parity rows above show all four files at
   zero, while `FormBuilder.field_helpers` already lists `fileField`,
   `checkbox` and `radioButton`. The `form_for` suite story names the closed
   story as its dependency, so most of that suite waits on this gap.
2. **`form_options_helper.rb` and the select / collection `Tags`**, with
   `form_options_helper_test.rb`, `form_collections_helper_test.rb` and the
   i18n variant. Starts with deleting the register entries.
3. **`date_helper.rb`'s remaining 41 methods** and `Tags::DateSelect`,
   `DatetimeSelect`, `TimeSelect`, with `date_helper_i18n_test.rb`.
4. **`form_tag_helper.rb`'s remaining 30 methods** and `form_helper.rb`'s
   remaining 37.
5. **`translation_helper.rb`** and `translation_helper_test.rb`.
6. **`atom_feed_helper.rb`.** It drives `Builder::XmlMarkup`, and the
   `builder` handler is a recorded non-port (`template/handlers/builder.rb` in
   the register), so this may be a receipt rather than a port. Decide first.
7. **`controller_helper.rb` at 2/12.** Ten delegators report missing; check
   whether that is a naming mismatch against `installControllerDelegates`
   before treating it as unported surface.
8. **The stale register entries** for `helpers.rb` and `asset_tag_helper.rb`.

## Non-goals

- **The rendering core, the TSE compiler, layouts.** RFC 0140.
- **`trails-tsc` view typing.** The open `trails-tsc-*` stories stay in RFC
  0140, which declares `trails-tsc` in its packages. They are not rendering
  core either, and may want their own home, but they are not helpers.
- **`ActionView::TestCase`** (`test_case.rb`). Excluded in the register as test
  harness; revisit only if a helper suite cannot be ported without it.

## Rollout

Phases 3 to 5 have no stories yet; they name the gap each will be filed from.

1. **Measure and structure.**
   - Re-run `pnpm parity:api --package actionview --files` from a fresh
     `pnpm build` and replace the indicative figures in this README.
   - `actionview-remaining-helper-namespaces-as-live-modules`
   - `move-number-with-delimiter-to-actionview`. Its body predates
     actionview's own `numberWithDelimiter`; what is left is the activesupport
     side. Re-scope before it goes ready.
   - Gap 8 (stale register entries), then record the post-removal baseline.
2. **Form fields.**
   - `form-builder-nested-attributes-probe-misses-ar-writer-spelling`, first,
     because Open question 1 decides what the `fields_for` tests assert.
   - Gap 1 (checkbox / radio / file tags).
   - `port-form-helper-test-form-for-and-fields-for-suite`. Its `text_field` /
     `textarea` / `label` / `hidden_field` portion is shippable today, which is
     why it is `ready`; the rest follows Gap 1, as its own text says.
   - Gap 4 (the remaining `form_helper.rb` and `form_tag_helper.rb` methods).
3. **Selects and collections.** Gap 2.
4. **Dates.** Gap 3.
5. **Small files.**
   - `port-action-view-csp-helper`
   - `port-action-view-csrf-helper-and-generated-layout-meta-tags`
   - Gaps 5, 6 and 7.

Outside the sequence: `dom-assertions-fragment-parses-with-nokogiri-html4`
stays blocked until Open question 2 is answered. No phase waits on it, since
the suites pass against the tokenizer today.

## Verification

Baseline at filing: 192 missing methods across 15 compared helper files, 11
helper files hidden by the register, 8 Rails helper test files unported.

- `pnpm parity:api --package actionview --files` reports **0 missing** on every
  `helpers/**` row. From the indicative baseline that is 192 to 0 in compared
  files, and about 241 to 0 once the register entries are removed.
- `scripts/parity/unported-files/actionview.ts` holds **0 helper entries**,
  down from 11, or each survivor carries a reason that is true of the tree
  (`atom_feed_helper.rb` may become one, per Gap 6).
- The 8 unported helper test files listed under Motivation reach **0**, and
  `form_helper_test.rb:1599-4140` has all 168 tests ported.
- The post-removal baseline measured in phase 1 is written into this section in
  place of "about 241".

## Open questions

1. **One spelling for the nested-attributes writer.** The form builder probes
   `comments_attributes=`; ActiveRecord generates `commentsAttributes=`. Which
   side moves is the substance of
   `form-builder-nested-attributes-probe-misses-ar-writer-spelling`, and it
   decides what the `fields_for` suite asserts.
2. **Which HTML parser backs `Nokogiri::HTML4`.** libxml2-wasm ships without
   libxml2's HTML module. A custom wasm build or an npm parser is a
   runtime-dependency decision that RFC 0160's `assert_select` story is waiting
   on as well.

## Changelog

- 2026-10-01: filed as a draft during the RFC 0140 refine (tasks#216) and
  numbered 0176.
- 2026-10-01: 7 stories rehomed in by verb on `main` (4 from RFC 0140, 2 from
  RFC 0141, 1 from RFC 0023). Review follow-up: Rollout mapped story by story,
  Verification given a baseline, the draft gate on the three `ready` stories
  stated, and RFC 0141's routing table pointed here.
