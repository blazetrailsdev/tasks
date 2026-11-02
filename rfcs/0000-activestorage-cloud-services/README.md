---
rfc: "0000-activestorage-cloud-services"
title: "Port ActiveStorage's S3 and GCS services"
status: active
created: 2026-11-02
updated: 2026-11-02
owner: "@deanmarano"
packages:
  - activestorage
  - trailties
clusters:
  - as-cloud-infra
  - as-cloud-s3
  - as-cloud-gcs
priority: 2
---

<!-- Unnumbered until merge -->

# RFC — Port ActiveStorage's S3 and GCS services

## Summary

Port `ActiveStorage::Service::S3Service` and `GCSService` into
`@blazetrails/activestorage` at `src/service/s3-service.ts` and
`src/service/gcs-service.ts`, over the vendor SDKs as optional peers, with
their Rails tests running in CI against local emulators and no cloud
credentials. Azure stays unported. RFC `0209-activestorage-port` stays
Disk-scoped.

## Motivation

RFC 0209 lists the cloud services as a non-goal
(`scripts/parity/unported-files/activestorage.ts`, `CLOUD_SERVICE`), so a trails
application can only store attachments on a local disk. Nothing in production
can use that across more than one host. In Rails these are 403 lines of service
code (`s3_service.rb` 171, `gcs_service.rb` 232), 509 lines of service tests, and
the gated cloud arms of three controller test files.

## Decisions

Owner decisions of 2026-11-02, binding:

1. **S3 and GCS only.** Azure is out: Rails deprecates its service and the
   `azure-storage-blob` gem
   (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/azure_storage_service.rb:21`).
2. **No adapter package and no wrapper package.** The services are nested in
   `@blazetrails/activestorage`. A consumer installs the vendor SDK it uses, an
   optional peer, loaded by an awaited import. A missing SDK raises
   `Missing service adapter for ...` (`configurator.rb:32-33`).
3. **CI runs against emulators**, with no cloud credentials.
4. **A separate RFC, startable now.** Deps on 0209 appear only where a cloud
   story truly needs an open 0209 story.

## Design

### Packages

Checked with `npm view` and exercised against emulators on 2026-11-02.

| Service | Optional peer                   | Version | Used for                                     |
| ------- | ------------------------------- | ------- | -------------------------------------------- |
| S3      | `@aws-sdk/client-s3`            | 3.1161  | every object call                            |
| S3      | `@aws-sdk/s3-request-presigner` | 3.1161  | `getSignedUrl`, split out of the client      |
| S3      | `@aws-sdk/lib-storage`          | 3.1161  | `Upload`, the port of `upload_stream`        |
| GCS     | `@google-cloud/storage`         | 8.4     | every call, including presigning and compose |

GCS needs one package: signing is in `File#getSignedUrl`, and
`google-auth-library`, which IAM signing reaches, is its dependency. The three
AWS packages must share a version, since `s3-request-presigner` and
`lib-storage` are built against client types.

### Configurator: the registry retires

RFC 0209's "explicit registry of service classes" followed the `const_get`
ruling RFC 0213 has since reversed (CLAUDE.md § "Constant lookup is an import or
a registry"). `configurator.ts` still carries it: a module-private `services`
table of `DiskService` and `MirrorService`. Rails' class name is computed from
`storage.yml`, which is application data, so the port is now a lookup. This
supersedes that paragraph of 0209 for `resolve`; the name `Service::Registry`
(`registry.rb`, the named-service cache) is unrelated and stays.

Ruby's `resolve` (`configurator.rb:29-34`) does a sync `require` under a
`rescue LoadError`, and it is reached synchronously through
`Registry#fetch` from `Blob#service`. ESM has no sync load by computed path. So
it takes the shape of `ConnectionAdapters.load`
(`packages/activerecord/CLAUDE.md` § "An adapter file is loaded by an awaited
step"):

- `Configurator.load(configurations)` is an awaited step, with
  `@noRailsEquivalent PERMANENT`, that imports
  `./${dasherized underscored name}-service.js` for each `service:` value. A
  failed import of a missing module is held in a module-private table. Any other
  error propagates, as Ruby rescues only `LoadError`.
- `resolve` stays sync and is Rails' body: raise the held failure as
  `Missing service adapter for ${rbInspect(className)}`, else
  `constGet(Service, ...)`.
- The awaited sites are the `active_storage.services` initializer
  (`engine.rb:139-153`) and tests that call `Service.configure`.

`s3-service.ts` imports its SDK with a plain top-level `import`. That is the
port of `gem "aws-sdk-s3"` at the head of `s3_service.rb:3-5`: loading the file
is what fails. Neither file may be reachable from `index.ts` or from the eager
`class-paths.generated.ts`; that table imports every module it names, so a
cloud service listed there would make every consumer need every SDK. The
`class-paths.excluded.generated.ts` shape, imported by the module it describes
as `transformers/image-processing-transformer.ts` does, is the precedent.

`service: AzureStorage` has no file, so it raises `Missing service adapter`,
which is what Rails raises for a missing `azure-storage-blob` gem.

### The async boundary: `url` becomes async

RFC 0209 made `url`, `url_for_direct_upload` and `headers_for_direct_upload` sync
because Disk signs in memory. That does not survive the SDKs:

- `getSignedUrl` in `s3-request-presigner` and `File#getSignedUrl` are both
  async, with no sync form.
- `client.config.endpoint()` and credential providers are async, and S3's
  `public_url` needs the endpoint.
- GCS IAM signing (`gcs_service.rb:211-226`) is a network call inside the Ruby
  `signer` lambda, so no in-process signer can make it sync.

**`Service#url` and `url_for_direct_upload` become async on every service**, and
so do `Blob#url`, `Blob#service_url_for_direct_upload`, `Variant#url`,
`VariantWithRecord#url` and their mirror delegations.
`headers_for_direct_upload` stays sync: no service does I/O for it.
`Preview#url` is already async (`preview.ts:64`). The cascade is small, because
`rails_blob_path` and the view helpers build application routes and never call
`service.url`: the callers are the redirect controllers, the direct-upload JSON
and `Blob#url` readers, all of which already await. This is the shape of a job's
`perform`: a language shortcoming, ratified by writing it into CLAUDE.md in
`activestorage-service-url-is-async`.

### Gem-backed port rules and SDK differences

The port wraps real npm clients and is async from its first PR, with no empty
seats. Differences a porter would otherwise rediscover:

- **Client options.** `Aws::S3::Resource.new(**options)` takes flat
  `access_key_id` / `secret_access_key` / `region`. `S3Client` nests
  `credentials`, so the constructor maps those. `endpoint` and
  `force_path_style` map to `endpoint` and `forcePathStyle`.
- **No resource layer.** `Object#exists?`, `#content_length`, `#get`, `#put`,
  `Bucket#objects.batch_delete!` are `HeadObject`, `GetObject`, `PutObject`, and
  paged `ListObjectsV2` plus `DeleteObjects`. `object_for` and `bucket` have no
  object to return and are `@missingRailsCall` candidates per call site.
- **Upload options.** `upload: { acl:, server_side_encryption: }` are Ruby SDK
  keys, spread into each put. The JS SDK spells them `ACL` and
  `ServerSideEncryption`; `upload_options` stays camelCase for the test's
  `upload_options[:acl]`, with one module-private key map at the SDK boundary.
- **`upload_stream`** yields a writable pipe to a block that feeds it. `Upload`
  takes a `Body`, so the port passes a `PassThrough`, writes in the block's
  position and ends it, awaiting `done()`. Writes must respect backpressure, or
  `compose` buffers every source in memory. A `compose` of 10,000 small parts is
  still a Rails limit, not a port bug.
- **`io`.** `upload` takes a ruby-compat IO. `io.size` picks the arm, and the
  multipart body is that IO read as chunks with an awaited read.
- **Checksums.** The JS SDK adds a default CRC32 trailer. The client sets
  `requestChecksumCalculation` and `responseChecksumValidation` to
  `WHEN_REQUIRED`, so `Content-MD5` is the integrity check Rails relies on and
  S3-compatible stores work. `BadDigest` maps to `IntegrityError`. The probes ran
  this way; the default was not tested.
- **`presigned_url`** takes `whitelist_headers: ["content-length"]`. The JS
  option is `signableHeaders`, and it must also list `content-type` and
  `content-md5`, or they hoist into the query. The probes used all three.
- **`public_url`** has no JS SDK method. It is computed from the awaited endpoint
  and bucket, including the `virtual_host` arm.
- **Downloads.** `body.string.force_encoding(BINARY)` is
  `Body.transformToByteArray()`, a `Uint8Array` per CLAUDE.md § "A String has no
  encoding tag either".
- **GCS.** `file_for(key, skip_lookup: true)` makes no request in either SDK.
  `create_file(md5:)` is `file.save` with `metadata.md5Hash`, `validation: false`
  and `resumable: false`. Errors are told apart by `ApiError#code`, 400 and 404,
  where Ruby has `InvalidArgumentError` and `NotFoundError`.
- **GCS IAM signing.** Ruby passes `issuer:` and `signer:` per call. Node takes
  neither; it signs through the `Storage` auth client. See
  `activestorage-gcs-iam-signing`.

### Emulators

Each candidate was run from Docker on 2026-11-02 with the SDKs above. MinIO's
official images can no longer be pulled (`minio/minio`, `quay.io/minio/minio`,
pinned 2025 tags: access denied), and its repository is archived. The
`cgr.dev/chainguard/minio` rebuild does run.

| Check                        | SeaweedFS | chainguard MinIO | RustFS    | versitygw | s3mock |
| ---------------------------- | --------- | ---------------- | --------- | --------- | ------ |
| Bad MD5 is `BadDigest`       | yes       | yes              | yes       | yes       | no     |
| Range, 404, multipart 8 MB   | yes       | yes              | yes       | yes       | yes    |
| Presigned GET, response hdrs | yes       | yes              | yes       | yes       | yes    |
| Presigned PUT                | yes       | yes              | yes       | yes       | yes    |
| Oversize signed PUT is 403   | yes       | yes              | yes       | yes       | no     |
| `public-read` then anon GET  | 200       | 403              | 403       | 403       | 200    |
| SSE `AES256`, as started     | 500       | needs KMS        | needs key | no        | yes    |

LocalStack exited with code 55 and asked for credentials, which decision 3
excludes.

**S3: SeaweedFS** (`chrislusf/seaweedfs`), the one candidate passing every check
but SSE. Its `SERVICE_CONFIGURATIONS` sets `endpoint` and `forcePathStyle`.

**GCS: fake-gcs-server** (`fsouza/fake-gcs-server`) passed MD5 rejection, range,
404, prefix listing, compose, metadata update, signed GET, v4 signed PUT and
public GET.

Known gaps, none hidden:

- **S3 SSE.** "uploading with server-side encryption" fails on SeaweedFS as
  started. `activestorage-cloud-ci-emulators` tries its KMS configuration. The
  fallback is RustFS or MinIO with their key set, for that one test.
- **GCS v2 signed PUT.** fake-gcs answers `400 invalid uploadType` to a v2 URL
  and routes only v4. Rails uses v2 unless `cache_control` is set
  (`gcs_service.rb:95`). So "direct upload" (twice), "direct upload with content
  disposition" and the controller's GCS PUT cannot run as written. See open
  question 1.
- **GCS signatures are not verified.** A tampered v4 URL answered 200. No GCS
  test here proves a signature valid.
- **GCS public access is not modelled.** fake-gcs serves everything, so "public
  URL generation" proves the URL's shape, not that the bucket is public.
- **GCS `response-content-disposition`.** Real GCS can be stopped from honouring
  it by stored metadata, which is why Rails stores it (`gcs_service.rb:23-26`).
  fake-gcs let the query parameter override a stored disposition in the probe.
  So assertions that the stored value wins ("upload with content_type and
  content_disposition", "update custom_metadata", "direct upload with content
  disposition") are expected to fail on it, and read the stored metadata instead.
- **Real hostnames.** The `amazonaws.com` and `storage.googleapis.com` URL
  assertions need the default endpoint. Signing is offline, so those tests build
  a second service with dummy credentials and no `endpoint`.
- **IAM signing** needs a metadata server and IAM API; those two tests sit behind
  Rails' own `gsa_email` guard and stay skipped.
- **Behaviour on real S3 and GCS is never exercised in CI.** That follows from
  decision 3, and this RFC accepts it.

GitHub service containers take neither a `command:` nor arguments, and both
emulators need arguments, so CI starts them with `docker run` steps.

## Non-goals

- **Azure.** `azure_storage_service.rb`, its two test files and the Azure arms of
  the controller tests are `PERMANENT` unported, citing this RFC's decision 1.
  The `azure-blob` gem Rails recommends is third party and out of scope too.
- **A trails package per cloud, or a wrapper over the SDKs:** decision 2.
- **`app/javascript`:** 0209's non-goal stands.
- **Real-cloud CI lanes:** decision 3.

## Alternatives considered

- **Keep `url` sync with a hand-written SigV4 over `node:crypto` and prewarmed
  credentials.** Rejected: it reimplements the SDK, credential refresh is async,
  and it cannot cover GCS IAM signing.
- **A sync `url` returning a thenable string.** Rejected for the reason in
  CLAUDE.md § "A translation lookup is synchronous": a Proxy cannot be a string.
- **An `async_url` twin.** Rejected as in § "A job's `perform` and `enqueue` are
  async": two spellings, one of them dead for two of the three services.
- **MinIO via the chainguard rebuild.** Rejected: it fails the public ACL check,
  and `public URL generation` would need a bucket policy Rails' test lacks.
- **A dynamic `import()` of the SDK inside each method.** Rejected: it moves the
  failure from load to first use, past `Missing service adapter`.

## Rollout

1. Infrastructure — `activestorage-configurator-loads-services`,
   `activestorage-service-url-is-async`,
   `activestorage-cloud-peer-dependencies`,
   `activestorage-azure-permanent-registers`,
   `activestorage-cloud-ci-emulators`,
   `activestorage-cloud-test-configurations`,
   `activestorage-engine-awaits-service-load`,
   `activestorage-storage-yml-template-peers`
2. S3 — `activestorage-s3-service-object-calls`,
   `activestorage-s3-service-multipart-and-compose`,
   `activestorage-s3-service-urls`, `activestorage-s3-service-test`,
   `activestorage-s3-public-service-test`,
   `activestorage-s3-controller-tests`
3. GCS — `activestorage-gcs-service-object-calls`,
   `activestorage-gcs-service-urls`, `activestorage-gcs-iam-signing`,
   `activestorage-gcs-service-test`, `activestorage-gcs-public-service-test`,
   `activestorage-gcs-controller-tests`

Only the engine story and the two controller-test stories depend on open 0209
stories. S3 and GCS run in parallel.

## Verification

- `scripts/parity/unported-files/activestorage.ts` holds no S3 or GCS row, and
  its only cloud rows are the two Azure ones.
- `parity:api` reports `s3_service.rb` and `gcs_service.rb` at 100%.
- `parity:test` matches every test in the four service test files, each gap a
  `PERMANENT-SKIP` or a ruling recorded here; only the two IAM tests are skipped
  in a run with no `gsa_email`.
- A CI lane runs them against the emulators with no cloud secret in scope.
- With neither SDK installed, `import "@blazetrails/activestorage"` works and
  `service: S3` raises `Missing service adapter for "S3"`.

## Open questions

1. **GCS v2 direct-upload tests on fake-gcs.** Options: a test helper that
   rewrites the v2 URL to the form fake-gcs routes; an upstream fake-gcs change;
   or asserting the v2 URL offline and parking the PUT. Recommendation: assert
   the URL offline and upload through the existing v4 path, with a
   `PERMANENT-SKIP` only if neither works. Deferred to
   `activestorage-gcs-service-test`.
2. **Async `url`.** It reverses a line of 0209's design and needs a CLAUDE.md
   section. Recommendation as in the Design. Deferred to
   `activestorage-service-url-is-async`, which stops for the owner's ruling
   before changing code.
3. **Third-party services.** Rails finds any
   `active_storage/service/foo_service` on the load path, as the `azure-blob` gem
   does. Recommendation: `load` skips a class already seated at
   `Service.FooService`, which is the seat a third-party module writes.
   Deferred to `activestorage-configurator-loads-services`.
4. **SeaweedFS as a dependency.** It is a heavy server used as a test double, and
   a different product from the MinIO the owner named. Recommendation: accept
   it. Deferred to `activestorage-cloud-ci-emulators`.

## Changelog

- 2026-11-02: initial RFC
- 2026-11-02: self-review: register row count, 0209 cross-reference, test-row
  retirement, trailties in scope
