import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ComponentResourceOptions,
  Output,
  Resource,
  all,
  interpolate,
  output,
} from "@pulumi/pulumi";
import { Cdn, CdnArgs } from "./cdn.js";
import { Bucket, BucketArgs } from "./bucket.js";
import { Component, Prettify, Transform, transform } from "../component.js";
import { Link } from "../link.js";
import { Input } from "../input.js";
import { globSync } from "glob";
import { BucketFile, BucketFiles } from "./providers/bucket-files.js";
import { getContentType, BaseSiteDev } from "../base/base-site.js";
import {
  BaseStaticSiteArgs,
  BaseStaticSiteAssets,
  buildApp,
  prepare,
} from "../base/base-static-site.js";
import { cloudfront, getRegionOutput, s3 } from "@pulumi/aws";
import { URL_UNAVAILABLE } from "./linkable.js";
import { KvKeys } from "./providers/kv-keys.js";
import {
  CF_BLOCK_CLOUDFRONT_URL_INJECTION,
  CF_ROUTER_GLOBAL_INJECTION,
  CF_SITE_ROUTER_INJECTION,
} from "./router.js";
import { readDirRecursivelySync } from "../../util/fs.js";
import { DistributionInvalidation } from "./providers/distribution-invalidation.js";

export interface StaticSiteArgs extends BaseStaticSiteArgs {
  /**
   * Configure how this component works in `sst dev`.
   *
   * :::note
   * In `sst dev` your static site is run in dev mode; it's not deployed.
   * :::
   *
   * Instead of deploying your static site, this starts it in dev mode. It's run
   * as a separate process in the `sst dev` multiplexer. Read more about
   * [`sst dev`](/docs/reference/cli/#dev).
   *
   * To disable dev mode, pass in `false`.
   */
  dev?: false | Prettify<BaseSiteDev>;
  /**
   * Path to the directory where your static site is located. By default this assumes your static site is in the root of your SST app.
   *
   * This directory will be uploaded to S3. The path is relative to your `sst.config.ts`.
   *
   * :::note
   * If the `build` options are specified, `build.output` will be uploaded to S3 instead.
   * :::
   *
   * If you are using a static site generator, like Vite, you'll need to configure the `build` options. When these are set, the `build.output` directory will be uploaded to S3 instead.
   *
   * @default `"."`
   *
   * @example
   *
   * Change where your static site is located.
   *
   * ```js
   * {
   *   path: "packages/web"
   * }
   * ```
   */
  path?: BaseStaticSiteArgs["path"];
  /**
   * Configure the base path of the site.
   *
   * You can serve your site from a subpath. For example, if you want to serve
   * your site at `https://my-app.com/docs`, you can do the following.
   *
   * If you are using site generator like Vite, first make sure the base path is set in
   * your static site generator.
   *
   * For Vite, set the `base` option in your `vite.config.ts`. The value should end with
   * `/`. This is to ensure the asset paths (ie. .css, .js) are correctly constructed.
   * ```js {2} title="vite.config.ts"
   * export default defineConfig({
   *   base: "/docs/",
   * });
   * ```
   *
   * Then set the base path on the StaticSite component, and disable the CDN.
   *
   * ```js {2} title="sst.config.ts"
   * const docs = new sst.aws.StaticSite("Docs", {
   *   base: "/docs",
   *   cdn: false,
   * });
   * ```
   *
   * Finally, add the site as a route to the Router component.
   *
   * ```js {4}
   * const router = new sst.aws.Router("MyRouter", {
   *   domain: "my-app.com",
   * });
   * router.routeSite("/docs", docs);
   * ```
   */
  base?: Input<string>;
  /**
   * Configure CloudFront Functions to customize the behavior of HTTP requests and responses at the edge.
   */
  edge?: Input<{
    /**
     * Configure the viewer request function.
     *
     * The viewer request function can be used to modify incoming requests before they
     * reach your origin server. For example, you can redirect users, rewrite URLs,
     * or add headers.
     *
     * By default, a viewer request function is created to:
     * - Disable CloudFront default URL if custom domain is set.
     * - Rewrite URLs to append `index.html` to the URL if the URL ends with a `/`.
     * - Rewrite URLs to append `.html` to the URL if the URL does not contain a file extension.
     *
     * @example
     *
     * You can pass in the code to inject into the function. The provided code will be
     * injected at the end of the function.
     *
     * ```js
     * async function handler(event) {
     *   // Default behavior code
     *
     *   // User injected code
     *
     *   return event.request;
     * }
     * ```
     *
     * To add a custom header to all requests.
     *
     * ```js
     * {
     *   edge: {
     *     viewerRequest: {
     *       injection: `event.request.headers["x-foo"] = "bar";`
     *     }
     *   }
     * }
     * ```
     *
     * You can use this add basic auth, [check out an example](/docs/examples/#aws-static-site-basic-auth).
     */
    viewerRequest?: Input<{
      /**
       * The code to inject into the viewer request function.
       *
       * @example
       * To add a custom header to all requests.
       *
       * ```js
       * {
       *   edge: {
       *     viewerRequest: {
       *       injection: `event.request.headers["x-foo"] = "bar";`
       *     }
       *   }
       * }
       * ```
       */
      injection: Input<string>;
      /**
       * The KV store to associate with the viewer request function.
       *
       * @example
       * ```js
       * {
       *   edge: {
       *     viewerRequest: {
       *       kvStore: "arn:aws:cloudfront::123456789012:key-value-store/my-store"
       *     }
       *   }
       * }
       * ```
       */
      kvStore?: Input<string>;
      /**
       * @deprecated Use `kvStore` instead because CloudFront Functions only support one KV store.
       */
      kvStores?: Input<Input<string>[]>;
    }>;
    /**
     * Configure the viewer response function.
     *
     * The viewer response function can be used to modify outgoing responses before they
     * are sent to the client. For example, you can add security headers or change the response
     * status code.
     *
     * By default, no viewer response function is set. A new function will be created with
     * the provided code.
     *
     * @example
     *
     * You can pass in the code to inject into the function. And a CloudFront function will
     * be created with the provided code injected into it.
     *
     * ```js
     * async function handler(event) {
     *   // User injected code
     *
     *   return event.response;
     * }
     * ```
     *
     * To add a custom header to all responses.
     *
     * ```js
     * {
     *   edge: {
     *     viewerResponse: {
     *       injection: `event.response.headers["x-foo"] = "bar";`
     *     }
     *   }
     * }
     * ```
     */
    viewerResponse?: Input<{
      /**
       * The code to inject into the viewer response function.
       *
       * @example
       * To add a custom header to all responses.
       *
       * ```js
       * {
       *   edge: {
       *     viewerResponse: {
       *       injection: `event.response.headers["x-foo"] = "bar";`
       *     }
       *   }
       * }
       * ```
       */
      injection: Input<string>;
      /**
       * The KV store to associate with the viewer response function.
       *
       * @example
       * ```js
       * {
       *   server: {
       *     edge: {
       *       viewerResponse: {
       *         kvStore: "arn:aws:cloudfront::123456789012:key-value-store/my-store"
       *       }
       *     }
       *   }
       * }
       * ```
       */
      kvStore?: Input<string>;
      /**
       * @deprecated Use `kvStore` instead because CloudFront Functions only support one KV store.
       */
      kvStores?: Input<Input<string>[]>;
    }>;
  }>;
  /**
   * Configure if your static site needs to be built. This is useful if you are using a static site generator.
   *
   * The `build.output` directory will be uploaded to S3 instead.
   * @example
   * For a Vite project using npm this might look like this.
   *
   * ```js
   * {
   *   build: {
   *     command: "npm run build",
   *     output: "dist"
   *   }
   * }
   * ```
   */
  build?: BaseStaticSiteArgs["build"];
  /**
   * Configure how the static site's assets are uploaded to S3.
   *
   * By default, this is set to the following. Read more about these options below.
   * ```js
   * {
   *   assets: {
   *     textEncoding: "utf-8",
   *     fileOptions: [
   *       {
   *         files: ["**\/*.css", "**\/*.js"],
   *         cacheControl: "max-age=31536000,public,immutable"
   *       },
   *       {
   *         files: "**\/*.html",
   *         cacheControl: "max-age=0,no-cache,no-store,must-revalidate"
   *       }
   *     ]
   *   }
   * }
   * ```
   * @default `Object`
   */
  assets?: Prettify<
    BaseStaticSiteAssets & {
      /**
       * The name of the S3 bucket to upload the assets to.
       * @default Creates a new bucket
       * @example
       * ```js
       * {
       *   assets: {
       *     bucket: "my-existing-bucket"
       *   }
       * }
       * ```
       *
       * :::note
       * The bucket must allow CloudFront to access the bucket.
       * :::
       *
       * When using an existing bucket, ensure that the bucket has a policy that allows CloudFront to access the bucket.
       * For example, the bucket policy might look like this:
       * ```json
       * {
       *   "Version": "2012-10-17",
       *   "Statement": [
       *     {
       *       "Effect": "Allow",
       *       "Principal": {
       *         "Service": "cloudfront.amazonaws.com"
       *       },
       *       "Action": "s3:GetObject",
       *       "Resource": "arn:aws:s3:::my-existing-bucket/*"
       *     }
       *   ]
       * }
       * ```
       */
      bucket?: Input<string>;
      /**
       * The path into the S3 bucket where the assets should be uploaded.
       * @default Root of the bucket
       * @example
       * ```js
       * {
       *   assets: {
       *     path: "websites/my-website"
       *   }
       * }
       * ```
       */
      path?: Input<string>;
      /**
       * Configure if files from previous deployments should be purged from the bucket.
       * @default `true`
       * @example
       * ```js
       * {
       *   assets: {
       *     purge: false
       *   }
       * }
       * ```
       */
      purge?: Input<boolean>;
      /**
       * Configure additional asset routes for serving files directly from the S3 bucket.
       *
       * These routes allow files stored in specific S3 bucket paths to be served under the
       * same domain as your site. This is particularly useful for handling user-uploaded
       * content.
       *
       * @example
       * If user-uploaded files are stored in the `uploads` directory, and no `routes` are
       * configured, these files will return 404 errors or display the `errorPage` if set.
       * By including `uploads` in `routes`, all files in that folder will be served
       * directly from the S3 bucket.
       *
       * ```js
       * {
       *   assets: {
       *     routes: ["uploads"]
       *   }
       * }
       * ```
       */
      routes?: Input<Input<string>[]>;
    }
  >;
  /**
   * Set a custom domain for your static site. Supports domains hosted either on
   * [Route 53](https://aws.amazon.com/route53/) or outside AWS.
   *
   * :::tip
   * You can also migrate an externally hosted domain to Amazon Route 53 by
   * [following this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).
   * :::
   *
   * @example
   *
   * ```js
   * {
   *   domain: "domain.com"
   * }
   * ```
   *
   * Specify a `www.` version of the custom domain.
   *
   * ```js
   * {
   *   domain: {
   *     name: "domain.com",
   *     redirects: ["www.domain.com"]
   *   }
   * }
   * ```
   */
  domain?: CdnArgs["domain"];
  /**
   * Configure how the CloudFront cache invalidations are handled. This is run after your static site has been deployed.
   * :::tip
   * You get 1000 free invalidations per month. After that you pay $0.005 per invalidation path. [Read more here](https://aws.amazon.com/cloudfront/pricing/).
   * :::
   * @default `{paths: "all", wait: false}`
   * @example
   * Turn off invalidations.
   * ```js
   * {
   *   invalidation: false
   * }
   * ```
   * Wait for all paths to be invalidated.
   * ```js
   * {
   *   invalidation: {
   *     paths: "all",
   *     wait: true
   *   }
   * }
   * ```
   */
  invalidation?: Input<
    | false
    | {
        /**
         * Configure if `sst deploy` should wait for the CloudFront cache invalidation to finish.
         *
         * :::tip
         * For non-prod environments it might make sense to pass in `false`.
         * :::
         *
         * Waiting for the CloudFront cache invalidation process to finish ensures that the new content will be served once the deploy finishes. However, this process can sometimes take more than 5 mins.
         * @default `false`
         * @example
         * ```js
         * {
         *   invalidation: {
         *     wait: true
         *   }
         * }
         * ```
         */
        wait?: Input<boolean>;
        /**
         * The paths to invalidate.
         *
         * You can either pass in an array of glob patterns to invalidate specific files. Or you can use the built-in option `all` to invalidation all files when any file changes.
         *
         * :::note
         * Invalidating `all` counts as one invalidation, while each glob pattern counts as a single invalidation path.
         * :::
         * @default `"all"`
         * @example
         * Invalidate the `index.html` and all files under the `products/` route.
         * ```js
         * {
         *   invalidation: {
         *     paths: ["/index.html", "/products/*"]
         *   }
         * }
         * ```
         */
        paths?: Input<"all" | string[]>;
      }
  >;
  /**
   * By default, a standalone CloudFront distribution is created.
   *
   * If you want to use a `Router` component to serve your site, set this to
   * `false`.
   *
   * @default `true`
   * @example
   * ```js
   * {
   *   cdn: false
   * }
   * ```
   */
  cdn?: Input<boolean>;
  /**
   * [Transform](/docs/components#transform) how this component creates its underlying
   * resources.
   */
  transform?: {
    /**
     * Transform the Bucket resource used for uploading the assets.
     */
    assets?: Transform<BucketArgs>;
    /**
     * Transform the CloudFront CDN resource.
     */
    cdn?: Transform<CdnArgs>;
  };
}

/**
 * The `StaticSite` component lets you deploy a static website to AWS. It uses [Amazon S3](https://aws.amazon.com/s3/) to store your files and [Amazon CloudFront](https://aws.amazon.com/cloudfront/) to serve them.
 *
 * It can also `build` your site by running your static site generator, like [Vite](https://vitejs.dev) and uploading the build output to S3.
 *
 * @example
 *
 * #### Minimal example
 *
 * Simply uploads the current directory as a static site.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb");
 * ```
 *
 * #### Change the path
 *
 * Change the `path` that should be uploaded.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   path: "path/to/site"
 * });
 * ```
 *
 * #### Running locally
 *
 * In `sst dev`, we don't deploy your site to AWS because we assume you are running it locally.
 *
 * :::note
 * Your static site will not be deployed when run locally with `sst dev`.
 * :::
 *
 * For example, for a Vite site, you can run it locally with.
 *
 * ```bash
 * sst dev vite dev
 * ```
 *
 * This will start the Vite dev server and pass in any environment variables that you've set in your config. But it will not deploy your site to AWS.
 *
 * #### Deploy a Vite SPA
 *
 * Use [Vite](https://vitejs.dev) to deploy a React/Vue/Svelte/etc. SPA by specifying the `build` config.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   build: {
 *     command: "npm run build",
 *     output: "dist"
 *   }
 * });
 * ```
 *
 * #### Deploy a Jekyll site
 *
 * Use [Jekyll](https://jekyllrb.com) to deploy a static site.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   errorPage: "/404.html",
 *   build: {
 *     command: "bundle exec jekyll build",
 *     output: "_site"
 *   }
 * });
 * ```
 *
 * #### Deploy a Gatsby site
 *
 * Use [Gatsby](https://www.gatsbyjs.com) to deploy a static site.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   errorPage: "/404.html",
 *   build: {
 *     command: "npm run build",
 *     output: "public"
 *   }
 * });
 * ```
 *
 * #### Deploy an Angular SPA
 *
 * Use [Angular](https://angular.dev) to deploy a SPA.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   build: {
 *     command: "ng build --output-path dist",
 *     output: "dist"
 *   }
 * });
 * ```
 *
 * #### Add a custom domain
 *
 * Set a custom domain for your site.
 *
 * ```js {2} title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   domain: "my-app.com"
 * });
 * ```
 *
 * #### Redirect www to apex domain
 *
 * Redirect `www.my-app.com` to `my-app.com`.
 *
 * ```js {4} title="sst.config.ts"
 * new sst.aws.StaticSite("MyWeb", {
 *   domain: {
 *     name: "my-app.com",
 *     redirects: ["www.my-app.com"]
 *   }
 * });
 * ```
 *
 * #### Set environment variables
 *
 * Set `environment` variables for the build process of your static site. These will be used locally and on deploy.
 *
 * :::tip
 * For Vite, the types for the environment variables are also generated. This can be configured through the `vite` prop.
 * :::
 *
 * For some static site generators like Vite, [environment variables](https://vitejs.dev/guide/env-and-mode) prefixed with `VITE_` can be accessed in the browser.
 *
 * ```ts {5-7} title="sst.config.ts"
 * const bucket = new sst.aws.Bucket("MyBucket");
 *
 * new sst.aws.StaticSite("MyWeb", {
 *   environment: {
 *     BUCKET_NAME: bucket.name,
 *     // Accessible in the browser
 *     VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_123"
 *   },
 *   build: {
 *     command: "npm run build",
 *     output: "dist"
 *   }
 * });
 * ```
 */
export class StaticSite extends Component implements Link.Linkable {
  private cdn?: Output<Cdn | undefined>;
  private bucket?: Bucket;
  private devUrl?: Output<string>;
  private _cdnData?: {
    base: Output<string | undefined>;
    entries: Output<Record<string, string>>;
    purge: Output<boolean>;
    invalidation: Output<
      | false
      | {
          paths: string[];
          version: string;
          wait: boolean;
        }
    >;
    invalidationDependsOn: Input<Resource>[];
  };

  constructor(
    name: string,
    args: StaticSiteArgs = {},
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);

    const parent = this;
    const { sitePath, environment, indexPage } = prepare(args);
    const dev = normalizeDev();

    if (dev.enabled) {
      this.devUrl = dev.url;
      this.registerOutputs({
        _metadata: {
          mode: "placeholder",
          path: sitePath,
          environment,
          url: this.url,
        },
        _dev: dev.outputs,
      });
      return;
    }

    const base = normalizeBase();
    const errorPage = normalizeErrorPage();
    const assets = normalizeAsssets();
    const outputPath = buildApp(
      parent,
      name,
      args.build,
      sitePath,
      environment,
    );
    const bucket = createBucket();
    const { bucketName, bucketDomain } = getBucketDetails();
    const assetsUploaded = uploadAssets();
    const kvEntries = buildKvEntries();
    const invalidation = buildInvalidation();

    const distribution = output(args.cdn).apply((cdn) => {
      if (cdn === false) return;
      const kvNamespace = buildRequestKvNamespace();
      const kvStoreArn = createRequestKvStore();
      const requestFunction = createRequestFunction();
      const responseFunction = createResponseFunction();
      const distribution = createDistribution();
      const kvUpdated = createKvValues();
      createInvalidation();
      return distribution;

      function buildRequestKvNamespace() {
        // In the case multiple sites use the same kv store, we need to namespace the keys
        return crypto
          .createHash("md5")
          .update(`${$app.name}-${$app.stage}-${name}`)
          .digest("hex")
          .substring(0, 4);
      }

      function createRequestKvStore() {
        return output(args.edge).apply((edge) => {
          const viewerRequest = edge?.viewerRequest;
          const userKvStore =
            viewerRequest?.kvStore ?? viewerRequest?.kvStores?.[0];
          if (userKvStore) return output(userKvStore);

          return new cloudfront.KeyValueStore(`${name}KvStore`, {}, { parent })
            .arn;
        });
      }

      function createKvValues() {
        return new KvKeys(
          `${name}KvKeys`,
          {
            store: kvStoreArn!,
            namespace: kvNamespace,
            entries: kvEntries,
            purge: assets.purge,
          },
          { parent },
        );
      }

      function createInvalidation() {
        invalidation.apply((invalidation) => {
          if (!invalidation) return;

          new DistributionInvalidation(
            `${name}Invalidation`,
            {
              distributionId: distribution.nodes.distribution.id,
              paths: invalidation.paths,
              version: invalidation.version,
              wait: invalidation.wait,
            },
            { parent, dependsOn: [assetsUploaded, kvUpdated] },
          );
        });
      }

      function createRequestFunction() {
        return output(args.edge).apply((edge) => {
          const userInjection = edge?.viewerRequest?.injection ?? "";
          const blockCloudfrontUrlInjection = args.domain
            ? CF_BLOCK_CLOUDFRONT_URL_INJECTION
            : "";
          return new cloudfront.Function(
            `${name}CloudfrontFunctionRequest`,
            {
              runtime: "cloudfront-js-2.0",
              keyValueStoreAssociations: kvStoreArn ? [kvStoreArn] : [],
              code: interpolate`
import cf from "cloudfront";
async function handler(event) {
  ${userInjection}
  ${blockCloudfrontUrlInjection}
  ${CF_SITE_ROUTER_INJECTION}

  const kvNamespace = "${kvNamespace}";

  // Load metadata
  let metadata;
  try {
    const v = await cf.kvs().get(kvNamespace + ":metadata");
    metadata = JSON.parse(v);
  } catch (e) {}

  await routeSite(kvNamespace, metadata);
  return event.request;
}

${CF_ROUTER_GLOBAL_INJECTION}`,
            },
            { parent },
          );
        });
      }

      function createResponseFunction() {
        return output(args.edge).apply((edge) => {
          const userConfig = edge?.viewerResponse;
          const userInjection = userConfig?.injection;
          const kvStoreArn = userConfig?.kvStore ?? userConfig?.kvStores?.[0];

          if (!userInjection) return;

          return new cloudfront.Function(
            `${name}CloudfrontFunctionResponse`,
            {
              runtime: "cloudfront-js-2.0",
              keyValueStoreAssociations: kvStoreArn ? [kvStoreArn] : [],
              code: `
import cf from "cloudfront";
async function handler(event) {
  ${userInjection}
  return event.response;
}`,
            },
            { parent },
          );
        });
      }

      function createDistribution() {
        return new Cdn(
          ...transform(
            args.transform?.cdn,
            `${name}Cdn`,
            {
              comment: `${name} site`,
              domain: args.domain,
              origins: [
                {
                  originId: "default",
                  domainName: "placeholder.sst.dev",
                  customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "https-only",
                    originReadTimeout: 20,
                    originSslProtocols: ["TLSv1.2"],
                  },
                },
              ],
              defaultCacheBehavior: {
                targetOriginId: "default",
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: [
                  "DELETE",
                  "GET",
                  "HEAD",
                  "OPTIONS",
                  "PATCH",
                  "POST",
                  "PUT",
                ],
                cachedMethods: ["GET", "HEAD"],
                compress: true,
                // CloudFront's managed CachingOptimized policy
                cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
                functionAssociations: all([
                  requestFunction,
                  responseFunction,
                ]).apply(([reqFn, resFn]) => [
                  { eventType: "viewer-request", functionArn: reqFn.arn },
                  ...(resFn
                    ? [{ eventType: "viewer-response", functionArn: resFn.arn }]
                    : []),
                ]),
              },
            },
            { parent },
          ),
        );
      }
    });
    this.bucket = bucket;
    this.cdn = distribution;
    this._cdnData = {
      base,
      entries: kvEntries,
      purge: assets.purge,
      invalidation,
      invalidationDependsOn: [assetsUploaded],
    };

    this.registerOutputs({
      _hint: this.url,
      _metadata: {
        mode: "deployed",
        path: sitePath,
        environment,
        url: this.url,
      },
      _dev: dev.outputs,
    });

    function normalizeDev() {
      const enabled = $dev && args.dev !== false;
      const devArgs = args.dev || {};

      return {
        enabled,
        url: output(devArgs.url ?? URL_UNAVAILABLE),
        outputs: {
          title: devArgs.title,
          environment,
          command: output(devArgs.command ?? "npm run dev"),
          autostart: output(devArgs.autostart ?? true),
          directory: output(devArgs.directory ?? sitePath),
        },
      };
    }

    function normalizeBase() {
      return output(args.base).apply((v) => {
        if (!v) return undefined;
        return "/" + v.replace(/^\//, "").replace(/\/$/, "");
      });
    }

    function normalizeErrorPage() {
      return all([indexPage, args.errorPage]).apply(
        ([indexPage, errorPage]) => {
          return "/" + (errorPage ?? indexPage).replace(/^\//, "");
        },
      );
    }

    function normalizeAsssets() {
      return {
        ...args.assets,
        // remove leading and trailing slashes from the path
        path: args.assets?.path
          ? output(args.assets?.path).apply((v) =>
              v.replace(/^\//, "").replace(/\/$/, ""),
            )
          : undefined,
        purge: output(args.assets?.purge ?? true),
        // normalize to /path format
        routes: args.assets?.routes
          ? output(args.assets?.routes).apply((v) =>
              v.map(
                (route) => "/" + route.replace(/^\//, "").replace(/\/$/, ""),
              ),
            )
          : undefined,
      };
    }

    function createBucket() {
      if (assets.bucket) return;

      return new Bucket(
        ...transform(
          args.transform?.assets,
          `${name}Assets`,
          { access: "cloudfront" },
          { parent, retainOnDelete: false },
        ),
      );
    }

    function getBucketDetails() {
      const s3Bucket = bucket
        ? bucket.nodes.bucket
        : s3.BucketV2.get(`${name}Assets`, assets.bucket!, undefined, {
            parent,
          });

      return {
        bucketName: s3Bucket.bucket,
        bucketDomain: s3Bucket.bucketRegionalDomainName,
      };
    }

    function uploadAssets() {
      return all([outputPath, assets]).apply(async ([outputPath, assets]) => {
        const bucketFiles: BucketFile[] = [];

        // Build fileOptions
        const fileOptions = assets?.fileOptions ?? [
          {
            files: "**",
            cacheControl: "max-age=0,no-cache,no-store,must-revalidate",
          },
          {
            files: ["**/*.js", "**/*.css"],
            cacheControl: "max-age=31536000,public,immutable",
          },
        ];

        // Upload files based on fileOptions
        const filesProcessed: string[] = [];
        for (const fileOption of fileOptions.reverse()) {
          const files = globSync(fileOption.files, {
            cwd: path.resolve(outputPath),
            nodir: true,
            dot: true,
            ignore: [
              ".sst/**",
              ...(typeof fileOption.ignore === "string"
                ? [fileOption.ignore]
                : fileOption.ignore ?? []),
            ],
          }).filter((file) => !filesProcessed.includes(file));

          bucketFiles.push(
            ...(await Promise.all(
              files.map(async (file) => {
                const source = path.resolve(outputPath, file);
                const content = await fs.promises.readFile(source, "utf-8");
                const hash = crypto
                  .createHash("sha256")
                  .update(content)
                  .digest("hex");
                return {
                  source,
                  key: path.posix.join(assets.path ?? "", file),
                  hash,
                  cacheControl: fileOption.cacheControl,
                  contentType:
                    fileOption.contentType ?? getContentType(file, "UTF-8"),
                };
              }),
            )),
          );
          filesProcessed.push(...files);
        }

        return new BucketFiles(
          `${name}AssetFiles`,
          {
            bucketName,
            files: bucketFiles,
            purge: assets.purge,
            region: getRegionOutput(undefined, { parent }).name,
          },
          { parent },
        );
      });
    }

    function buildKvEntries() {
      return all([outputPath, assets, bucketDomain, errorPage, base]).apply(
        async ([outputPath, assets, bucketDomain, errorPage, base]) => {
          const files = readDirRecursivelySync(path.join(outputPath));
          const kvEntries = Object.fromEntries(
            files.map((file) => [path.posix.join("/", file), "s3"]),
          );

          kvEntries["metadata"] = JSON.stringify({
            base,
            custom404: errorPage,
            s3: {
              domain: bucketDomain,
              dir: assets.path ? "/" + assets.path : "",
              routes: assets.routes,
            },
          });
          return kvEntries;
        },
      );
    }

    function buildInvalidation() {
      return all([outputPath, args.assets, args.invalidation]).apply(
        ([outputPath, assets, invalidationRaw]) => {
          // Normalize invalidation
          if (invalidationRaw === false) return false;
          const invalidation = {
            wait: false,
            paths: "all" as const,
            ...invalidationRaw,
          };

          // Build invalidation paths
          const invalidationPaths =
            invalidation.paths === "all" ? ["/*"] : invalidation.paths;
          if (invalidationPaths.length === 0) return false;

          // Calculate a hash based on the contents of the S3 files. This will be
          // used to determine if we need to invalidate our CloudFront cache.
          //
          // The below options are needed to support following symlinks when building zip files:
          // - nodir: This will prevent symlinks themselves from being copied into the zip.
          // - follow: This will follow symlinks and copy the files within.
          const hash = crypto.createHash("md5");
          hash.update(JSON.stringify(assets ?? {}));
          globSync("**", {
            dot: true,
            nodir: true,
            follow: true,
            cwd: path.resolve(outputPath),
          }).forEach((filePath) =>
            hash.update(
              fs.readFileSync(path.resolve(outputPath, filePath), "utf-8"),
            ),
          );

          return {
            paths: invalidationPaths,
            version: hash.digest("hex"),
            wait: invalidation.wait,
          };
        },
      );
    }
  }

  /**
   * The URL of the website.
   *
   * If the `domain` is set, this is the URL with the custom domain.
   * Otherwise, it's the autogenerated CloudFront URL.
   */
  public get url() {
    return all([this.cdn, this.devUrl]).apply(([cdn, dev]) => {
      return all([cdn?.domainUrl, cdn?.url]).apply(
        ([domainUrl, url]) => domainUrl ?? url ?? dev,
      );
    });
  }

  /**
   * The CDN data for the site.
   * @internal
   */
  public get cdnData() {
    return this._cdnData;
  }

  /**
   * The underlying [resources](/docs/components/#nodes) this component creates.
   */
  public get nodes() {
    return {
      /**
       * The Amazon S3 Bucket that stores the assets.
       */
      assets: this.bucket,
      /**
       * The Amazon CloudFront CDN that serves the site.
       */
      cdn: this.cdn,
    };
  }

  /** @internal */
  public getSSTLink() {
    return {
      properties: {
        url: this.url,
      },
    };
  }
}

const __pulumiType = "sst:aws:StaticSite";
// @ts-expect-error
StaticSite.__pulumiType = __pulumiType;
