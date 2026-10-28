---
rfc: "0209-activestorage-port"
title: "Port ActiveStorage on the Disk service"
status: draft
created: 2026-10-28
updated: 2026-10-28
owner: "@deanmarano"
packages:
  - activestorage
  - ruby-compat
clusters:
  - as-infra
  - as-services
  - as-models
  - as-attached
  - as-analysis
  - as-variants
  - as-previews
  - as-controllers
  - as-engine
---

# RFC 0209 — Port ActiveStorage on the Disk service

## Summary

Port `vendor/rails/v8.0.2/activestorage` (lib, app, db, config) to a new
`packages/activestorage`, with its Minitest suite, on the **Disk service
only** (repo-owner scope ruling, 2026-10-28). Variants go through
`ImageProcessingTransformer` over the `image-processing-port` RFC (0202), which
sits on the landed `@blazetrails/mini-magick` (RFC 0203). Analyzers and
previewers shell out to ffprobe, ffmpeg, mutool and pdftoppm as mini_magick
shells out to ImageMagick. Parity enrollment is the first story, so every
later story is measured from the start.

## Motivation

`trails new` already scaffolds ActiveStorage configuration with no package
behind it (`generator-scaffolds-unported-subsystems`, RFC 0104), the trailties
`Configuration#load_defaults` arms set `activeStorage.queues` and
`trackVariants` on an object nobody reads
(`packages/trailties/src/application/configuration.ts:201-246`), and two
actionview form tests are blocked on ActiveStorage routes
(`actionview-tests-needing-actionpack-controller-and-parameters`). The
gemspec's dependencies (`activestorage.gemspec`: activesupport, actionpack,
activejob, activerecord, marcel) are all ported.

Shape of the source:

| Part                                                      | Ruby lines | Notes                                            |
| --------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `app/models/active_storage/**`                            | ~1,330     | Blob (380 + concerns), Attachment, Variant\*     |
| `app/controllers/**`                                      | ~370       | blobs / representations / disk / direct uploads  |
| `app/jobs/**`                                             | ~75        | analyze, mirror, preview_image, purge, transform |
| `lib/active_storage/attached/**`                          | ~850       | `has_one_attached` / `has_many_attached`         |
| `lib/active_storage/service{,/disk,/configurator,…}.rb`   | ~520       | in scope                                         |
| `lib/active_storage/service/{s3,gcs,azure}_service.rb`    | ~600       | non-goal                                         |
| `lib/active_storage/{analyzer,previewer,transformers}/**` | ~800       | shell out / image_processing                     |
| `lib/active_storage.rb`, `engine.rb`, the rest            | ~900       | config, railtie, fixture set, log subscriber     |
| `db/**`                                                   | ~110       | one migration and three update migrations        |
| `app/javascript/**`                                       | ~480       | non-goal (see below)                             |

About 3.5k countable lib/app lines are in scope. The suite has 491
`test`/`def test_` blocks across 47 files, plus 14 shared service tests
(`test/service/shared_service_tests.rb`) included by each service test, about
505 in all; the S3, GCS and Azure files (39 tests) are out of scope.

## Design

### Package layout and parity

`packages/activestorage` mirrors the gem as `packages/solid-queue` mirrors
solid_queue: one `vendor/sources.ts` package entry under the `rails` source
with `libPath: "activestorage/lib/active_storage"`,
`libEntryFile: "activestorage/lib/active_storage.rb"`, `testPath:
"activestorage/test"` and `extraLibPaths` for
`app/models/active_storage`, `app/controllers/active_storage`,
`app/controllers/concerns/active_storage` and `app/jobs/active_storage`. No
lib and app file shares a basename, so the flattened `src/` has no collision
(`src/blob.ts`, `src/service/disk-service.ts`, `src/blobs/proxy-controller.ts`).
The enrollment story also does the rest of the enumerating-guard checklist
(`vendor/sources.test.ts`, `extract-ts-tests.ts`, `compare.ts` `pkgDirs`,
`MANIFEST_PACKAGES`, `ENROLLED_PACKAGES`, the hand-added
`assertion-mismatch-mark.json` row) and the new-package registrations
(`ci.yml`, workspace, guard fixture).

### Disk only; where cloud services plug in

`Service::Configurator#resolve` (`lib/active_storage/service/configurator.rb:29-34`)
`require`s `active_storage/service/#{class_name.underscore}_service` and
`const_get`s `"#{class_name}Service"`. Per the standing ruling on
`const_get` walks, the port is an **explicit registry** of service classes
keyed by the `service:` name in `storage.yml`, read by `resolve`, holding
`Disk` (and `Mirror`, if open question 3 says yes). A cloud service is a later
package or story that adds one registry entry and the class; nothing in
`Service`, `Blob` or the controllers names S3/GCS/Azure. A name with no entry raises
`RuntimeError` "Missing service adapter for …", as Rails' `rescue LoadError`
arm does (`configurator.rb:32-33`). `url_for_direct_upload` / `headers_for_direct_upload`
are ported on `Service` and `DiskService` because the Disk service answers
them (`disk_service.rb:77-99`).

### The async boundary

Every call that reaches the service, the filesystem, a child process or the
database is async; everything that computes a value from what is already in
memory stays sync.

- **Service.** `upload`, `download`, `download_chunk`, `open`, `compose`,
  `delete`, `delete_prefixed`, `exist?`, `update_metadata` are async on
  `Service` and `DiskService`. `url`, `url_for_direct_upload`,
  `headers_for_direct_upload`, `path_for` and `public?` are sync: Disk's URLs
  are signed with `ActiveStorage.verifier` and need no I/O
  (`disk_service.rb:124-143`).
- **Blob.** `upload`, `upload_without_unfurling`, `download`, `download_chunk`,
  `open`, `compose`, `delete`, `purge`, `purge_later`, `mirror_later`,
  `analyze`, `analyze_later` and the class-level `create_and_upload!`,
  `create_after_unfurling!`, `create_before_direct_upload!`, `compose`,
  `find_signed` are async. `key`, `filename`, `url`, `signed_id`, `image?` …
  `text?`, `custom_metadata` are sync.
- **Create paths with a block.** `Blob.create_and_upload!` runs `tap { upload }`
  after `save!`, and every AR create it reaches follows
  [packages/activerecord/CLAUDE.md § "A create path awaits its block before saving"](https://github.com/blazetrailsdev/trails/blob/main/packages/activerecord/CLAUDE.md#a-create-path-awaits-its-block-before-saving-creates-block).
- **Jobs.** `AnalyzeJob`, `MirrorJob`, `PreviewImageJob`, `PurgeJob` and
  `TransformJob` have async `perform`, and every `*_later` awaits
  `perform_later`, per CLAUDE.md § "A job's `perform` and `enqueue` are async".
- **Attaching.** The generated `avatar` reader is a property answering
  `Attached::One` (CLAUDE.md § "Generated attribute readers are properties").
  Ruby's `avatar=` (`attached/model.rb:117-126`) is the async
  `setAvatar(attachable)`, CLAUDE.md's settled spelling for a Ruby `x=` that
  must be awaited; the generated property has no setter half, so
  `user.avatar = file` is a type error, not a second spelling. `setAvatar`
  records the `Attached::Changes::CreateOne` / `DeleteOne` in
  `attachment_changes` and awaits `CreateOne`'s unfurl
  (`identify_without_saving`: the checksum and Marcel content type), so the
  blob is built when the writer resolves, as in Rails. Every io read is async.
  Mass assignment (`User.create!(avatar: file)`, `update(avatar: file)`) goes
  through the awaitable `setAttributes` that association writers already use;
  the sync `assignAttributes` and the constructor raise for an attachment key
  rather than park a promise for `save` to drain. The upload stays in the async
  `after_commit` (`attached/model.rb:144`). `attach`, `detach`, `purge` and
  `purge_later` on `One` / `Many` are async, since each reads, saves or
  deletes. `has_many_attached`'s `photos=` is `setPhotos` the same way.
- **Variants and previews.** `Variant#processed`, `VariantWithRecord#processed`,
  `Preview#processed`, `Variation#transform` and every transformer, analyzer
  and previewer call are async; `Variation#key`, `#digest`, `#format`,
  `#content_type` and `Variant#key` are sync.
- **Controllers** await the service call, as every trails action already
  awaits I/O.

### Proxies and dispatch

`Attached::One` and `Attached::Many` `delegate_missing_to` the attachment(s)
(`attached/one.rb:27`, `attached/many.rb:27`), and `Attachment`
`delegate_missing_to :blob` (`attachment.rb:33`). Each is a row in
CLAUDE.md's `method_missing` table, ported over activesupport's
`delegateMissingTo` as `active_support/delegation.rb`'s Proxy row already is.
`has_one_attached` / `has_many_attached` build their methods with
`generated_association_methods.class_eval <<-CODE` (`attached/model.rb:111`,
`:213`); the port defines the same accessors on the generated-association
module with no string eval.

### Analyzers and previewers shell out

`AudioAnalyzer` / `VideoAnalyzer` run `ffprobe` through `IO.popen`
(`analyzer/audio_analyzer.rb:56-71`), and `Previewer#capture`
(`previewer.rb:78-91`) runs `ffmpeg`, `mutool` or `pdftoppm` through
`IO.popen(argv, err: err)` and reads `$?`. They are **shelled out exactly as
mini_magick shells out**: argv through ruby-compat's child-process adapter,
no shell string, honouring `ActiveStorage.paths[:ffprobe]` etc. ruby-compat
has `Open3` but no `IO.popen`, so that is a prerequisite story. The CI runner
installs ffmpeg, mupdf-tools and poppler-utils beside ImageMagick. A test whose
binary is absent is skipped as Rails skips it (`*_exists?` guards,
`previewer/mupdf_previewer.rb:18-24`), never silently passed.
`ImageAnalyzer::ImageMagick` calls `@blazetrails/mini-magick`;
`ImageAnalyzer::Vips` calls wasm-vips, initialised by RFC 0202's Vips backend.

### Test database

The suite runs on the gem's dummy app: `test/database/setup.rb` migrates the
engine's migration and creates `users` and `groups`, and `test/test_helper.rb`
defines `User` and `Group` (`:129-201`). That is the Rails canonical for this
package, so it is mirrored as written rather than added to activerecord's
`schema.rb` mirror; `solid-queue-tests-separate-queue-database` is the
precedent for an engine test database.

## Non-goals

- **S3, GCS and Azure services** (`service/{s3,gcs,azure_storage}_service.rb`
  and their 39 tests): repo-owner scope ruling, 2026-10-28. They plug in as
  registry entries later; no stories are filed.
- **Mirror setups whose mirrors are cloud services**: same ruling. A
  Disk-to-Disk `MirrorService` is open question 3.
- **The browser JavaScript** (`app/javascript/activestorage`, the built
  `app/assets/javascripts/activestorage{,.esm}.js`, and
  `test/javascript_package_test.rb`). Recommendation: keep it a non-goal. It is
  already JavaScript, published upstream as `@rails/activestorage`, and talks
  only to the `DirectUploadsController` and `DiskController#update` this RFC
  ports, so a trails app can use the npm package unchanged. Porting it would be
  a copy, not a translation, and nothing in parity measures it.
- **`rails active_storage:install`'s Rake shape**
  (`lib/tasks/activestorage.rake`): the migration it copies is ported; the
  command itself follows however trailties ports `railties:install:migrations`.

## Alternatives considered

- **Port the cloud services now behind optional peers.** Rejected by the
  owner's scope ruling; it would also need three SDKs and credentials in CI.
- **Lay app/ files under `src/app/…`.** Rejected: solid-queue's
  `extraLibPaths` flattening is the enrolled precedent, and api-compare keys
  file paths that way.
- **A sync `avatar=` setter that defers the unfurl to `save`.** Briefly
  ruled, then reversed by the owner on 2026-10-28: it leaves the blob's
  `checksum`, `byte_size` and `content_type` unset between assignment and the
  first await, a window Rails does not have.
- **Sync io reads in `CreateOne#initialize`.** Rejected (owner, 2026-10-28):
  they block the event loop for the whole file and cannot read a stream.

## Rollout

1. Infrastructure — `activestorage-parity-enrollment-and-package`,
   `ruby-compat-io-popen`, `activestorage-ci-media-binaries`,
   `activestorage-module-config-errors-and-log-subscriber`
2. Services — `activestorage-service-registry-and-configurator`,
   `activestorage-disk-service`, `activestorage-mirror-service-over-disk`
3. Models — `activestorage-migrations-and-test-database`,
   `activestorage-filename-record-and-current`,
   `activestorage-blob-and-downloader`,
   `activestorage-test-helper-and-fixture-set`, `activestorage-blob-test`,
   `activestorage-attachment-model`
4. Attached — `activestorage-attached-model-and-one`,
   `activestorage-attached-many`, `activestorage-attached-one-test`,
   `activestorage-attached-many-test`,
   `activestorage-reflection-and-validations`
5. Analysis — `activestorage-image-analyzers`,
   `activestorage-audio-video-analyzers`
6. Variants — `activestorage-transformers`,
   `activestorage-variation-and-variants`, `activestorage-variant-tests`
7. Previews — `activestorage-previewers-and-preview`
8. Controllers — `activestorage-routes-and-controller-concerns`,
   `activestorage-blobs-controllers-and-streaming`,
   `activestorage-representations-controllers`,
   `activestorage-disk-and-direct-uploads-controllers`
9. Engine — `activestorage-engine`,
   `activestorage-actionview-template-integration`

Phases 2–4 need no image code and can run while RFC 0202 lands; phases 5–7
carry `deps` edges into RFC 0202 and RFC 0203 stories.

## Verification

- `parity:api` and `parity:test` report activestorage at 100% of the in-scope
  surface, with the S3/GCS/Azure files and the JavaScript package test recorded
  as permanent unported rows citing this RFC's non-goals.
- The ~466 in-scope Rails tests (505 less the 39 cloud-service tests) are
  ported and pass on SQLite, PostgreSQL and MariaDB, each skip a
  `PERMANENT-SKIP` citing a ruling.
- Every call gate, the argument gate, the parameter-name gate and the
  extra-surface gate are green for the package.
- The two blocked actionview direct-upload tests run against the ported routes.

## Open questions

1. **Generate, or hand-port?** marcel (RFC 0201) and mini_magick (RFC 0203)
   started from the Ruby-to-TS generator's output, and RFC 0185 measured its
   spikes on activestorage. Recommendation: hand-port story by story. Each
   story here is under the ceiling on its own, and a generated tree for a
   package this coupled to AR, AJ and actionpack would land as one large
   unreviewable starting PR rather than as these stories.
2. **`$?` after `IO.popen`.** `Previewer#capture` reads `$?.success?`
   (`previewer.rb:84-88`), a per-thread global. Recommendation: follow
   CLAUDE.md § "`$!` is passed explicitly": the ported `IO.popen` block form
   answers the block's value, and `Process.last_status` is seated per async
   context through `AsyncLocalStorage`, so two previews interleaving across an
   `await` cannot read each other's status. The alternative, returning the
   status beside the value, changes `IO.popen`'s signature.
3. **Disk-to-Disk `MirrorService`.** The scope ruling excludes mirrors that
   need cloud services; `MirrorService` itself is 93 lines and
   `mirror_service_test.rb` (7 tests plus the shared service tests) mirrors
   three Disk services to a Disk primary (`mirror_service_test.rb:6-14`). Recommendation: port it, since
   `Blob#mirror_later` and `MirrorJob` reach it and it needs no SDK. The story
   is filed; close it `FALSIFIED:` if the answer is no.
4. **Default `variant_processor`.** Rails' module default is `:mini_magick`
   (`lib/active_storage.rb:50`) and `load_defaults 7.0` sets `:vips`.
   Recommendation: keep both defaults as Rails has them; CI exercises both
   transformers through the 0202 backends.

## Decisions

- **The attachment writer is an async `setAvatar`** (owner, 2026-10-28).
  `has_one_attached :avatar`'s `avatar=` is `await user.setAvatar(file)` and
  `has_many_attached :photos`'s is `await user.setPhotos(files)`; there is no
  `=` setter. The writer awaits the attachable's unfurl, so a ported test reads
  the blob's checksum, size and content type right after it, as Rails does.
  Mass assignment of an attachment key goes through `setAttributes`; the
  constructor and `assignAttributes` raise for one, and nothing is parked for
  `save`.

## Changelog

- 2026-10-28: initial draft
- 2026-10-28: attachable io reads are async and deferred past the sync
  `avatar=` writer (owner ruling); former open question 4 moved to Decisions
- 2026-10-28: the attachment writer is an async `setAvatar` with no `=`
  setter, replacing the deferred-unfurl ruling (owner)
