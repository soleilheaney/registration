import {
  ComponentResourceOptions,
  Output,
  all,
  interpolate,
  output,
} from "@pulumi/pulumi";
import crypto from "crypto";
import { Component, Transform, transform } from "../component";
import { Link } from "../link";
import type { Input } from "../input";
import { Cdn, CdnArgs } from "./cdn";
import { cloudfront } from "@pulumi/aws";
import { hashStringToPrettyString, physicalName } from "../naming";
import { Bucket } from "./bucket";
import { OriginAccessControl } from "./providers/origin-access-control";
import { VisibleError } from "../error";
import { RouterUrlRoute } from "./router-url-route";
import { RouterBucketRoute } from "./router-bucket-route";
import { RouterSiteRoute } from "./router-site-route";
import { SsrSite } from "./ssr-site";
import { StaticSite } from "./static-site";
import { DurationSeconds } from "../duration";

interface InlineUrlRouteArgs extends InlineBaseRouteArgs {
  /**
   * The destination URL.
   *
   * @example
   *
   * ```js
   * {
   *   routes: {
   *     "/api/*": {
   *       url: "https://example.com"
   *     }
   *   }
   * }
   * ```
   */
  url: Input<string>;
  /**
   * Rewrite the request path.
   *
   * @example
   *
   * By default, if the route path is `/api/*` and a request comes in for `/api/users/profile`,
   * the request path the destination sees is `/api/users/profile`.
   *
   * If you want to serve the route from the root, you can rewrite the request path to
   * `/users/profile`.
   *
   * ```js
   * {
   *   routes: {
   *     "/api/*": {
   *       url: "https://api.example.com",
   *       rewrite: {
   *         regex: "^/api/(.*)$",
   *         to: "/$1"
   *       }
   *     }
   *   }
   * }
   * ```
   */
  rewrite?: Input<{
    /**
     * The regex to match the request path.
     */
    regex: Input<string>;
    /**
     * The replacement for the matched path.
     */
    to: Input<string>;
  }>;
}

interface InlineRouterBucketRouteArgs extends InlineBaseRouteArgs {
  /**
   * A bucket to route to.
   *
   * :::note
   * You need to let CloudFront `access` the bucket.
   * :::
   *
   * @example
   *
   * For example, let's say you have a bucket that gives CloudFront `access`.
   *
   * ```ts title="sst.config.ts" {2}
   * const myBucket = new sst.aws.Bucket("MyBucket", {
   *   access: "cloudfront"
   * });
   * ```
   *
   * You can then this directly as the destination for the route.
   *
   * ```js
   * {
   *   routes: {
   *     "/files/*": {
   *       bucket: myBucket
   *     }
   *   }
   * }
   * ```
   *
   * Or if you have an existing bucket, you can pass in its regional domain.
   *
   * ```js
   * {
   *   routes: {
   *     "/files/*": {
   *       bucket: "my-bucket.s3.us-east-1.amazonaws.com"
   *     }
   *   }
   * }
   * ```
   */
  bucket?: Input<Bucket | string>;
  /**
   * Rewrite the request path.
   *
   * @example
   *
   * By default, if the route path is `/files/*` and a request comes in for `/files/logo.png`,
   * the request path the destination sees is `/files/logo.png`. In the case of a bucket route,
   * the file `logo.png` is served from the `files` directory in the bucket.
   *
   * If you want to serve the file from the root of the bucket, you can rewrite
   * the request path to `/logo.png`.
   *
   * ```js
   * {
   *   routes: {
   *     "/files/*": {
   *       bucket: myBucket,
   *       rewrite: {
   *         regex: "^/files/(.*)$",
   *         to: "/$1"
   *       }
   *     }
   *   }
   * }
   * ```
   */
  rewrite?: Input<{
    /**
     * The regex to match the request path.
     */
    regex: Input<string>;
    /**
     * The replacement for the matched path.
     */
    to: Input<string>;
  }>;
}

interface InlineBaseRouteArgs {
  /**
   * The cache policy to use for the route.
   *
   * @default CloudFront's managed CachingOptimized policy
   * @example
   * ```js
   * {
   *   routes: {
   *     "/files/*": {
   *       url: "https://example.com"
   *       cachePolicy: "658327ea-f89d-4fab-a63d-7e88639e58f6"
   *     }
   *   }
   * }
   * ```
   */
  cachePolicy?: Input<string>;
  /**
   * Configure CloudFront Functions to customize the behavior of HTTP requests and responses at the edge.
   */
  edge?: {
    /**
     * Configure the viewer request function.
     *
     * The viewer request function can be used to modify incoming requests before they
     * reach your origin server. For example, you can redirect users, rewrite URLs,
     * or add headers.
     */
    viewerRequest?: Input<{
      /**
       * The code to inject into the viewer request function.
       *
       * By default, a viewer request function is created to add the `x-forwarded-host`
       * header. The given code will be injected at the end of this function.
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
       * @example
       * To add a custom header to all requests.
       *
       * ```js
       * {
       *   routes: {
       *     "/api/*": {
       *       url: "https://example.com"
       *       edge: {
       *         viewerRequest: {
       *           injection: `event.request.headers["x-foo"] = "bar";`
       *         }
       *       }
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
       *   routes: {
       *     "/api/*": {
       *       url: "https://example.com"
       *       edge: {
       *         viewerRequest: {
       *           kvStore: "arn:aws:cloudfront::123456789012:key-value-store/my-store"
       *         }
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
    /**
     * Configure the viewer response function.
     *
     * The viewer response function can be used to modify outgoing responses before
     * they are sent to the client. For example, you can add security headers or change
     * the response status code.
     *
     * By default, no viewer response function is set. A new function will be created
     * with the provided code.
     *
     * @example
     * Add a custom header to all responses
     * ```js
     * {
     *   routes: {
     *     "/api/*": {
     *       url: "https://example.com"
     *       edge: {
     *         viewerResponse: {
     *           injection: `event.response.headers["x-foo"] = "bar";`
     *         }
     *       }
     *     }
     *   }
     * }
     * ```
     */
    viewerResponse?: Input<{
      /**
       * The code to inject into the viewer response function.
       *
       * By default, no viewer response function is set. A new function will be created with
       * the provided code.
       *
       * ```js
       * async function handler(event) {
       *   // User injected code
       *
       *   return event.response;
       * }
       * ```
       *
       * @example
       * To add a custom header to all responses.
       *
       * ```js
       * {
       *   routes: {
       *     "/api/*": {
       *       url: "https://example.com"
       *       edge: {
       *         viewerResponse: {
       *           injection: `event.response.headers["x-foo"] = "bar";`
       *         }
       *       }
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
       *   routes: {
       *     "/api/*": {
       *       url: "https://example.com"
       *       edge: {
       *         viewerResponse: {
       *           kvStore: "arn:aws:cloudfront::123456789012:key-value-store/my-store"
       *         }
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
  };
}

interface RouteArgs {
  /**
   * The number of times that CloudFront attempts to connect to the origin. Must be
   * between 1 and 3.
   * @default 3
   * @example
   * ```js
   * {
   *   connectionAttempts: 1
   * }
   * ```
   */
  connectionAttempts?: Input<number>;
  /**
   * The number of seconds that CloudFront waits before timing out and closing the
   * connection to the origin. Must be between 1 and 10 seconds.
   * @default `"10 seconds"`
   * @example
   * ```js
   * {
   *   connectionTimeout: "3 seconds"
   * }
   * ```
   */
  connectionTimeout?: Input<DurationSeconds>;
}

export interface RouterUrlRouteArgs extends RouteArgs {
  /**
   * Rewrite the request path.
   *
   * @example
   *
   * If the route path is `/api/*` and a request comes in for `/api/users/profile`,
   * the request path the destination sees is `/api/users/profile`.
   *
   * If you want to serve the route from the root, you can rewrite the request
   * path to `/users/profile`.
   *
   * ```js
   * {
   *   rewrite: {
   *     regex: "^/api/(.*)$",
   *     to: "/$1"
   *   }
   * }
   * ```
   */
  rewrite?: Input<{
    /**
     * The regex to match the request path.
     */
    regex: Input<string>;
    /**
     * The replacement for the matched path.
     */
    to: Input<string>;
  }>;
  /**
   * The number of seconds that CloudFront waits for a response after routing a
   * request to the destination. Must be between 1 and 60 seconds.
   *
   * When compared to the `connectionTimeout`, this is the total time for the
   * request.
   *
   * @default `"30 seconds"`
   * @example
   * ```js
   * {
   *   readTimeout: "60 seconds"
   * }
   * ```
   */
  readTimeout?: Input<DurationSeconds>;
  /**
   * The number of seconds that CloudFront should try to maintain the connection
   * to the destination after receiving the last packet of the response. Must be
   * between 1 and 60 seconds
   * @default `"5 seconds"`
   * @example
   * ```js
   * {
   *   keepAliveTimeout: "10 seconds"
   * }
   * ```
   */
  keepAliveTimeout?: Input<DurationSeconds>;
}

export interface RouterBucketRouteArgs extends RouteArgs {
  /**
   * Rewrite the request path.
   *
   * @example
   *
   * If the route path is `/files/*` and a request comes in for `/files/logo.png`,
   * the request path the destination sees is `/files/logo.png`.
   *
   * If you want to serve the file from the root of the bucket, you can rewrite
   * the request path to `/logo.png`.
   *
   * ```js
   * {
   *   rewrite: {
   *     regex: "^/files/(.*)$",
   *     to: "/$1"
   *   }
   * }
   * ```
   */
  rewrite?: Input<{
    /**
     * The regex to match the request path.
     */
    regex: Input<string>;
    /**
     * The replacement for the matched path.
     */
    to: Input<string>;
  }>;
}

export interface RouterArgs {
  /**
   * Set a custom domain for your Router.
   *
   * Automatically manages domains hosted on AWS Route 53, Cloudflare, and Vercel. For other
   * providers, you'll need to pass in a `cert` that validates domain ownership and add the
   * DNS records.
   *
   * :::tip
   * Built-in support for AWS Route 53, Cloudflare, and Vercel. And manual setup for other
   * providers.
   * :::
   *
   * @example
   *
   * By default this assumes the domain is hosted on Route 53.
   *
   * ```js
   * {
   *   domain: "example.com"
   * }
   * ```
   *
   * For domains hosted on Cloudflare.
   *
   * ```js
   * {
   *   domain: {
   *     name: "example.com",
   *     dns: sst.cloudflare.dns()
   *   }
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
   * A map of routes to their destinations.
   *
   * @deprecated Use the `route`, `routeBucket`, and `routeSite` functions instead. These
   * functions provide a more flexible API for routing to URLs, buckets, and sites. They
   * also allow routing based on both domain and path patterns.
   *
   * The _key_ is the route path and the _value_ can be:
   *
   * - The destination URL as a string
   * - Or, an object with
   *   - Args for a URL route
   *   - Args for a bucket route
   *
   * :::note
   * All routes need to start with `/`.
   * :::
   *
   * For example, you can set the destination as a URL.
   *
   * ```ts
   * {
   *   routes: {
   *     "/*": "https://example.com"
   *   }
   * }
   * ```
   *
   * Or, you can route to a bucket.
   *
   * ```ts
   * {
   *   routes: {
   *     "/files/*": {
   *       bucket: myBucket
   *     }
   *   }
   * }
   * ```
   *
   * When router receives a request, the requested path is compared with path patterns
   * in the order they are listed. The first match determines which URL the
   * request is routed to.
   *
   * :::tip[Default Route]
   * The `/*` route is a default or catch-all route.
   * :::
   *
   * The `/*` route is a _default_ route, meaning that if no routes match, the `/*` route will be used. It does not matter where the `/*` route is listed in the routes object.
   *
   * :::note
   * If you don't have a `/*` route, you'll get a 404 error for any requests that don't match a route.
   * :::
   *
   * Suppose you have the following three routes.
   *
   * ```js
   * {
   *   routes: {
   *     "/api/*.json": "https://example1.com",
   *     "/api/*": "https://example2.com",
   *     "/*.xml": "https://example3.com",
   *   }
   * }
   * ```
   *
   * A request to `/api/sample.xml` will match `/api/*` first and route to it; even though it matches `/*.xml`.
   *
   * However for this case, a request to `/api/users` will route to `/api/*` even though it comes after `/*`. This is because the `/*` route is the default route.
   *
   * ```js
   * {
   *   routes: {
   *     "/*": "myapp.com",
   *     "/api/*": myFunction.url
   *   }
   * }
   * ```
   *
   * You can also customize the route behavior with injecting some code into the CloudFront
   * Functions. To do so, pass in an object, with the destination as the `url`.
   *
   * ```ts
   * {
   *   routes: {
   *     "/*": {
   *       url: "https://example.com",
   *       edge: {
   *         viewerRequest: {
   *           injection: `event.request.headers["x-foo"] = "bar";`
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   *
   * You can also `rewrite` the request path.
   *
   * ```ts
   * {
   *   routes: {
   *     "/files/*": {
   *       bucket: myBucket,
   *       rewrite: {
   *         regex: "^/files/(.*)$",
   *         to: "/$1"
   *       }
   *     }
   *   }
   * }
   * ```
   */
  routes?: Input<
    Record<
      string,
      Input<string | InlineUrlRouteArgs | InlineRouterBucketRouteArgs>
    >
  >;
  /**
   * Configure CloudFront Functions to customize the behavior of HTTP requests and responses at the edge.
   */
  edge?: {
    /**
     * Configure the viewer request function.
     *
     * The viewer request function can be used to modify incoming requests before they
     * reach your origin server. For example, you can redirect users, rewrite URLs,
     * or add headers.
     */
    viewerRequest?: Input<{
      /**
       * The code to inject into the viewer request function.
       *
       * By default, a viewer request function is created to:
       * - Disable CloudFront default URL if custom domain is set.
       * - Add the `x-forwarded-host` header.
       * - Route requests to the corresponding target based on the domain and request path.
       *
       * The given code will be injected at the beginning of this function.
       *
       * ```js
       * async function handler(event) {
       *   // User injected code
       *
       *   // Default behavior code
       *
       *   return event.request;
       * }
       * ```
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
    }>;
    /**
     * Configure the viewer response function.
     *
     * The viewer response function can be used to modify outgoing responses before
     * they are sent to the client. For example, you can add security headers or change
     * the response status code.
     *
     * By default, no viewer response function is set. A new function will be created
     * with the provided code.
     */
    viewerResponse?: Input<{
      /**
       * The code to inject into the viewer response function.
       *
       * ```js
       * async function handler(event) {
       *   // User injected code
       *
       *   return event.response;
       * }
       * ```
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
       *   edge: {
       *     viewerResponse: {
       *       kvStore: "arn:aws:cloudfront::123456789012:key-value-store/my-store"
       *     }
       *   }
       * }
       * ```
       */
      kvStore?: Input<string>;
    }>;
  };
  /**
   * Configure how the CloudFront cache invalidations are handled.
   * :::tip
   * You get 1000 free invalidations per month. After that you pay $0.005 per invalidation path. [Read more here](https://aws.amazon.com/cloudfront/pricing/).
   * :::
   * @default Invalidation is turned off
   * @example
   * Enable invalidations. Setting this to `true` will invalidate all paths. It is equivalent
   * to passing in `{ paths: ["/*"] }`.
   *
   * ```js
   * {
   *   invalidation: true
   * }
   * ```
   */
  invalidation?: Input<
    | boolean
    | {
        /**
         * Configure if `sst deploy` should wait for the CloudFront cache invalidation to finish.
         *
         * :::tip
         * For non-prod environments it might make sense to pass in `false`.
         * :::
         *
         * Waiting for this process to finish ensures that new content will be available after the deploy finishes. However, this process can sometimes take more than 5 mins.
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
         * The invalidation token is used to determine if the cache should be invalidated. If the
         * token is the same as the previous deployment, the cache will not be invalidated.
         *
         * @default A unique value is auto-generated on each deploy
         * @example
         * ```js
         * {
         *   invalidation: {
         *     token: "foo123"
         *   }
         * }
         * ```
         */
        token?: Input<string>;
        /**
         * Specify an array of glob pattern of paths to invalidate.
         *
         * :::note
         * Each glob pattern counts as a single invalidation. However, invalidating `/*` counts as a single invalidation as well.
         * :::
         * @default `["/*"]`
         * @example
         * Invalidate the `index.html` and all files under the `products/` route. This counts as two invalidations.
         * ```js
         * {
         *   invalidation: {
         *     paths: ["/index.html", "/products/*"]
         *   }
         * }
         * ```
         */
        paths?: Input<Input<string>[]>;
      }
  >;

  /**
   * [Transform](/docs/components#transform) how this component creates its underlying
   * resources.
   */
  transform?: {
    /**
     * Transform the Cache Policy that's attached to each CloudFront behavior.
     */
    cachePolicy?: Transform<cloudfront.CachePolicyArgs>;
    /**
     * Transform the CloudFront CDN resource.
     */
    cdn?: Transform<CdnArgs>;
  };
  /**
   * @internal
   */
  _skipHint?: boolean;
}

interface RouterRef {
  ref: boolean;
  distributionID: Input<string>;
}

/**
 * The `Router` component lets you use a CloudFront distribution to direct
 * requests to various parts of your application.
 *
 * #### How it works
 *
 * Behind the scenes, this uses:
 *
 * - The default CloudFront distribution behavior
 * - A CloudFront function for routing
 * - And a KV store to store the routing data
 *
 * When a request comes in, it does a lookup in the KV store and dynamically sets
 * the origin based on the routing data.
 *
 * You might notices a _placeholder.sst.dev_ behavior in CloudFront. This is not
 * used and is only there because CloudFront requires a behavior to exist.
 *
 * @example
 *
 * #### Minimal example
 *
 * ```ts title="sst.config.ts"
 * const router = new sst.aws.Router("MyRouter");
 * router.route("/*", "https://some-external-service.com");
 * ```
 *
 * #### Add a custom domain
 *
 * ```ts {2} title="sst.config.ts"
 * new sst.aws.Router("MyRouter", {
 *   domain: "myapp.com"
 * });
 * ```
 *
 * #### Route to a function URL
 *
 * ```ts title="sst.config.ts"
 * const myFunction = new sst.aws.Function("MyFunction", {
 *   handler: "src/api.handler",
 *   url: true,
 * });
 *
 * const router = new sst.aws.Router("MyRouter", {
 * });
 * router.route("/*", myFunction.url);
 * ```
 *
 * #### Route to a bucket
 *
 * ```ts title="sst.config.ts" {2}
 * const myBucket = new sst.aws.Bucket("MyBucket", {
 *   access: "cloudfront"
 * });
 *
 * const router = new sst.aws.Router("MyRouter");
 * router.routeBucket("/files/*", myBucket);
 * ```
 *
 * Make sure to allow CloudFront access to the bucket by setting the `access` prop on the bucket.
 *
 * #### Route to a frontend
 *
 * ```ts title="sst.config.ts" "cdn: false"
 * const site = new sst.aws.Nextjs("Site", { cdn: false });
 *
 * const router = new sst.aws.Router("MyRouter");
 * router.routeSite("/*", site);
 * ```
 *
 * We are disabling the built-in CDN of the Next.js app because we want to use the
 * router to serve the app.
 *
 * #### Route to a frontend on a subpath
 *
 * To serve your frontend from a subpath, you need to:
 *
 * 1. Configure the base path in your frontend framework.
 *
 *    <Tabs>
 *      <TabItem label="Next.js">
 *      Set the [`basePath`](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath) in your `next.config.js`.
 *
 *      ```js {2} title="next.config.js"
 *      export default defineConfig({
 *        basePath: "/docs"
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="Astro">
 *      Set the `base` option in your `astro.config.mjs`.
 *
 *      ```js {3} title="astro.config.mjs"
 *      export default defineConfig({
 *        adapter: sst(),
 *        base: "/docs"
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="Remix">
 *      Set the `base` option in your `vite.config.ts` with the trailing slash.
 *
 *      ```js {3} title="vite.config.ts"
 *      export default defineConfig({
 *        plugins: [...],
 *        base: "/docs/"
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="SvelteKit">
 *      Set the `base` option in your `svelte.config.js` without the trailing slash.
 *
 *      ```js {4} title="svelte.config.js"
 *      export default defineConfig({
 *        kit: {
 *          paths: {
 *            base: "/docs"
 *          }
 *        }
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="React">
 *      Set the `base` option in your `vite.config.ts` with the trailing slash.
 *
 *      ```js {3} title="vite.config.ts"
 *      export default defineConfig({
 *        plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
 *        base: "/docs/"
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="Nuxt">
 *      Set the `baseURL` option in your `nuxt.config.ts` without a trailing slash.
 *
 *      ```js {3} title="nuxt.config.ts"
 *      export default defineConfig({
 *        app: {
 *          baseURL: "/docs"
 *        }
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="SolidStart">
 *      Set the `baseURL` option in your `app.config.ts` without a trailing slash.
 *
 *      ```js {3} title="app.config.ts"
 *      export default defineConfig({
 *        server: {
 *          baseURL: "/docs"
 *        }
 *      });
 *      ```
 *      </TabItem>
 *      <TabItem label="Analog">
 *      Set the `base` and `apiPrefix` options in your `vite.config.ts`. The `apiPrefix` value should not begin with a slash.
 *
 *      ```js {4,7} title="vite.config.ts"
 *      export default defineConfig(({ mode }) => ({
 *        plugins: [
 *          analog({
 *            apiPrefix: "docs/api"
 *          })
 *        ],
 *        base: "/docs"
 *      }));
 *      ```
 *      </TabItem>
 *    </Tabs>
 *
 * 2. Disable the built-in CDN of the frontend.
 *
 *    <Tabs>
 *      <TabItem label="Next.js">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.Nextjs("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="Astro">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.Astro("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="Remix">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.Remix("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="SvelteKit">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.SvelteKit("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="React">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.React("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="Nuxt">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.Nuxt("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="SolidStart">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.SolidStart("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *      <TabItem label="Analog">
 *      ```ts title="sst.config.ts" "cdn: false"
 *      const site = new sst.aws.Analog("Site", { cdn: false });
 *      ```
 *      </TabItem>
 *    </Tabs>
 *
 * 3. Add the site to a Router.
 *
 *    ```ts title="sst.config.ts"
 *    const router = new sst.aws.Router("MyRouter");
 *    router.routeSite("/docs", site);
 *    ```
 */
export class Router extends Component implements Link.Linkable {
  private constructorName: string;
  private constructorOpts: ComponentResourceOptions;
  private cdn: Output<Cdn>;
  private kvStoreArn?: Output<string>;
  private kvNamespace?: Output<string>;
  private hasInlineRoutes?: Output<boolean>;

  constructor(
    name: string,
    args: RouterArgs = {},
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);
    const _refVersion = 2;
    const self = this;
    this.constructorName = name;
    this.constructorOpts = opts;

    if (args && "ref" in args) {
      const ref = reference();
      this.cdn = output(ref.cdn);
      this.kvStoreArn = ref.kvStoreArn;
      this.kvNamespace = ref.kvNamespace;
      this.hasInlineRoutes = ref.hasInlineRoutes;
      registerOutputs();
      return;
    }

    const hasInlineRoutes = args.routes !== undefined;

    let cdn, kvStoreArn, kvNamespace;
    if (hasInlineRoutes) {
      cdn = handleInlineRoutes();
    } else {
      const r = handleLazyRoutes();
      cdn = output(r.distribution);
      kvStoreArn = r.kvStoreArn;
      kvNamespace = output(r.kvNamespace);
    }

    this.cdn = cdn;
    this.kvStoreArn = kvStoreArn;
    this.kvNamespace = kvNamespace;
    this.hasInlineRoutes = output(hasInlineRoutes);
    registerOutputs();

    function reference() {
      const ref = args as unknown as RouterRef;
      const cdn = Cdn.get(`${name}Cdn`, ref.distributionID, { parent: self });
      const tags = cdn.nodes.distribution.tags.apply((tags) => {
        if (tags?.["sst:ref:version"] !== _refVersion.toString()) {
          throw new VisibleError(
            [
              `There have been some minor changes to the "Router" component that's being referenced by "${name}".\n`,
              `To update, you'll need to redeploy the stage where the Router was created. And then redeploy this stage.`,
            ].join("\n"),
          );
        }

        return {
          kvStoreArn: tags?.["sst:ref:kv"],
          kvNamespace: tags?.["sst:ref:kv-namespace"],
          hasInlineRoutes: tags?.["sst:ref:kv"] === undefined,
        };
      });

      return {
        cdn,
        kvStoreArn: tags.kvStoreArn,
        kvNamespace: tags.kvNamespace,
        hasInlineRoutes: tags.hasInlineRoutes,
      };
    }

    function registerOutputs() {
      self.registerOutputs({
        _hint: args._skipHint ? undefined : self.url,
      });
    }

    function handleInlineRoutes() {
      let defaultCachePolicy: cloudfront.CachePolicy;
      let defaultCfFunction: cloudfront.Function;
      let defaultOac: OriginAccessControl;
      const routes = normalizeRoutes();
      const cdn = createCdn();
      return cdn;

      function normalizeRoutes() {
        return output(args.routes!).apply((routes) => {
          const normalizedRoutes = Object.fromEntries(
            Object.entries(routes).map(([path, route]) => {
              // Route path must start with "/"
              if (!path.startsWith("/"))
                throw new Error(
                  `In "${name}" Router, the route path "${path}" must start with a "/"`,
                );

              route = typeof route === "string" ? { url: route } : route;

              const hasUrl = "url" in route ? 1 : 0;
              const hasBucket = "bucket" in route ? 1 : 0;
              if (hasUrl + hasBucket !== 1)
                throw new Error(
                  `In "${name}" Router, the route path "${path}" can only have one of url or bucket`,
                );

              return [path, route];
            }),
          );

          normalizedRoutes["/*"] = normalizedRoutes["/*"] ?? {
            url: "https://do-not-exist.sst.dev",
          };

          return normalizedRoutes;
        });
      }

      function createCfRequestDefaultFunction() {
        defaultCfFunction =
          defaultCfFunction ??
          new cloudfront.Function(
            `${name}CloudfrontFunction`,
            {
              runtime: "cloudfront-js-2.0",
              code: [
                `async function handler(event) {`,
                `  event.request.headers["x-forwarded-host"] = event.request.headers.host;`,
                `  return event.request;`,
                `}`,
              ].join("\n"),
            },
            { parent: self },
          );
        return defaultCfFunction;
      }

      function createCfRequestFunction(
        path: string,
        config:
          | {
              injection: string;
              kvStore?: string;
              kvStores?: string[];
            }
          | undefined,
        rewrite:
          | {
              regex: string;
              to: string;
            }
          | undefined,
        injectHostHeader: boolean,
      ) {
        return new cloudfront.Function(
          `${name}CloudfrontFunction${hashStringToPrettyString(path, 8)}`,
          {
            runtime: "cloudfront-js-2.0",
            keyValueStoreAssociations: config?.kvStore
              ? [config.kvStore]
              : config?.kvStores ?? [],
            code: `
async function handler(event) {
  ${
    injectHostHeader
      ? `event.request.headers["x-forwarded-host"] = event.request.headers.host;`
      : ""
  }
  ${
    rewrite
      ? `
const re = new RegExp("${rewrite.regex}");
event.request.uri = event.request.uri.replace(re, "${rewrite.to}");`
      : ""
  }
  ${config?.injection ?? ""}
  return event.request;
}`,
          },
          { parent: self },
        );
      }

      function createCfResponseFunction(
        path: string,
        config: {
          injection: string;
          kvStore?: string;
          kvStores?: string[];
        },
      ) {
        return new cloudfront.Function(
          `${name}CloudfrontFunctionResponse${hashStringToPrettyString(
            path,
            8,
          )}`,
          {
            runtime: "cloudfront-js-2.0",
            keyValueStoreAssociations: config.kvStore
              ? [config.kvStore]
              : config.kvStores ?? [],
            code: `
async function handler(event) {
  ${config.injection ?? ""}
  return event.response;
}`,
          },
          { parent: self },
        );
      }

      function createOriginAccessControl() {
        defaultOac =
          defaultOac ??
          new OriginAccessControl(
            `${name}S3AccessControl`,
            { name: physicalName(64, name) },
            { parent: self, ignoreChanges: ["name"] },
          );
        return defaultOac;
      }

      function createCachePolicy() {
        defaultCachePolicy =
          defaultCachePolicy ??
          new cloudfront.CachePolicy(
            ...transform(
              args.transform?.cachePolicy,
              `${name}CachePolicy`,
              {
                comment: `${name} router cache policy`,
                defaultTtl: 0,
                maxTtl: 31536000, // 1 year
                minTtl: 0,
                parametersInCacheKeyAndForwardedToOrigin: {
                  cookiesConfig: {
                    cookieBehavior: "none",
                  },
                  headersConfig: {
                    headerBehavior: "none",
                  },
                  queryStringsConfig: {
                    queryStringBehavior: "all",
                  },
                  enableAcceptEncodingBrotli: true,
                  enableAcceptEncodingGzip: true,
                },
              },
              { parent: self },
            ),
          );

        return defaultCachePolicy;
      }

      function createCdn() {
        return routes.apply((routes) => {
          const distributionData = Object.entries(routes).map(
            ([path, route]) => {
              if ("url" in route) {
                return {
                  origin: {
                    originId: path,
                    domainName: new URL(route.url).host,
                    customOriginConfig: {
                      httpPort: 80,
                      httpsPort: 443,
                      originProtocolPolicy: "https-only",
                      originReadTimeout: 20,
                      originSslProtocols: ["TLSv1.2"],
                    },
                  },
                  behavior: {
                    pathPattern: path,
                    targetOriginId: path,
                    functionAssociations: [
                      ...(route.edge?.viewerRequest || route.rewrite
                        ? [
                            {
                              eventType: "viewer-request",
                              functionArn:
                                route.edge?.viewerRequest || route.rewrite
                                  ? createCfRequestFunction(
                                      path,
                                      route.edge?.viewerRequest,
                                      route.rewrite,
                                      "url" in route,
                                    ).arn
                                  : createCfRequestDefaultFunction().arn,
                            },
                          ]
                        : []),
                      ...(route.edge?.viewerResponse
                        ? [
                            {
                              eventType: "viewer-response",
                              functionArn: createCfResponseFunction(
                                path,
                                route.edge.viewerResponse,
                              ).arn,
                            },
                          ]
                        : []),
                    ],
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
                    defaultTtl: 0,
                    compress: true,
                    cachePolicyId: route.cachePolicy ?? createCachePolicy().id,
                    // CloudFront's Managed-AllViewerExceptHostHeader policy
                    originRequestPolicyId:
                      "b689b0a8-53d0-40ab-baf2-68738e2966ac",
                  },
                };
              } else if ("bucket" in route) {
                return {
                  origin: {
                    originId: path,
                    domainName:
                      route.bucket instanceof Bucket
                        ? route.bucket.nodes.bucket.bucketRegionalDomainName
                        : route.bucket!,
                    originPath: "",
                    originAccessControlId: createOriginAccessControl().id,
                  },
                  behavior: {
                    pathPattern: path,
                    targetOriginId: path,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD"],
                    compress: true,
                    // CloudFront's managed CachingOptimized policy
                    cachePolicyId:
                      route.cachePolicy ??
                      "658327ea-f89d-4fab-a63d-7e88639e58f6",
                  },
                };
              }
              throw new Error("Invalid route type");
            },
          );

          return new Cdn(
            ...transform(
              args.transform?.cdn,
              `${name}Cdn`,
              {
                comment: `${name} router`,
                origins: distributionData.map((d) => d.origin),
                defaultCacheBehavior: {
                  ...distributionData.find(
                    (d) => d.behavior.pathPattern === "/*",
                  )!.behavior,
                  // @ts-expect-error
                  pathPattern: undefined,
                },
                orderedCacheBehaviors: distributionData
                  .filter((d) => d.behavior.pathPattern !== "/*")
                  .map((d) => d.behavior),
                domain: args.domain,
                wait: true,
              },
              { parent: self },
            ),
          );
        });
      }
    }

    function handleLazyRoutes() {
      const kvNamespace = buildRequestKvNamespace();
      const kvStoreArn = createRequestKvStore();
      const requestFunction = createRequestFunction();
      const responseFunction = createResponseFunction();
      const cachePolicyId = createCachePolicy().id;
      const distribution = createDistribution();

      return { kvNamespace, kvStoreArn, distribution };

      function buildRequestKvNamespace() {
        // In the case multiple routers use the same kv store, we need to namespace the keys
        return crypto
          .createHash("md5")
          .update(`${$app.name}-${$app.stage}-${name}`)
          .digest("hex")
          .substring(0, 4);
      }

      function createRequestKvStore() {
        return output(args.edge).apply((edge) => {
          const viewerRequest = edge?.viewerRequest;
          const userKvStore = viewerRequest?.kvStore;
          if (userKvStore) return output(userKvStore);

          return new cloudfront.KeyValueStore(
            `${name}KvStore`,
            {},
            { parent: self },
          ).arn;
        });
      }

      function createCachePolicy() {
        return new cloudfront.CachePolicy(
          `${name}ServerCachePolicy`,
          {
            comment: "SST server response cache policy",
            defaultTtl: 0,
            maxTtl: 31536000, // 1 year
            minTtl: 0,
            parametersInCacheKeyAndForwardedToOrigin: {
              cookiesConfig: {
                cookieBehavior: "none",
              },
              headersConfig: {
                headerBehavior: "whitelist",
                headers: {
                  items: ["x-open-next-cache-key"],
                },
              },
              queryStringsConfig: {
                queryStringBehavior: "all",
              },
              enableAcceptEncodingBrotli: true,
              enableAcceptEncodingGzip: true,
            },
          },
          { parent: self },
        );
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

  const routerNS = "${kvNamespace}";

  async function getRoutes() {
    let routes = [];
    try {
      const v = await cf.kvs().get(routerNS + ":routes");
      routes = JSON.parse(v);
    } catch (e) {}
    return routes;
  }

  async function matchRoute(routes) {
    const requestHost = event.request.headers.host.value;
    const match = routes
      ${
        /*
        Route format: [type, routeNamespace, hostRegex, pathPrefix]
        - First sort by host pattern (longest first)
        - Then sort by path prefix (longest first)
      */ ""
      }
      .map(r => {
        var parts = r.split(",");
        return { 
          type: parts[0], 
          routeNs: parts[1], 
          host: parts[2],
          path: parts[3]
        };
      })
      .sort((a, b) => {
        return (a.host.length !== b.host.length)
          ? b.host.length - a.host.length
          : b.path.length - a.path.length;
      })
      .find(r => {
        const hostMatches = r.host === "" || new RegExp(r.host).test("^" + requestHost + "$");
        const pathMatches = event.request.uri.startsWith(r.path);
        return hostMatches && pathMatches;
      });

    // Load metadata
    if (match) {
      try {
        const v = await cf.kvs().get(match.routeNs + ":metadata");
        return { type: match.type, routeNs: match.routeNs, metadata: JSON.parse(v) };
      } catch (e) {}
    }
  }

  // Look up the route
  const routes = await getRoutes();
  const route = await matchRoute(routes);
  if (!route) return event.request;
  if (route.metadata.rewrite) {
    const rw = route.metadata.rewrite;
    event.request.uri = event.request.uri.replace(new RegExp(rw.regex), rw.to);
  }
  if (route.type === "url") {
    event.request.headers["x-forwarded-host"] = event.request.headers.host;
    setUrlOrigin(route.metadata.host, route.metadata.origin);
  }
  if (route.type === "bucket") setS3Origin(route.metadata.domain, route.metadata.origin);
  if (route.type === "site") await routeSite(route.routeNs, route.metadata);
  return event.request;
}

${CF_ROUTER_GLOBAL_INJECTION}`,
            },
            { parent: self },
          );
        });
      }

      function createResponseFunction() {
        return output(args.edge).apply((edge) => {
          const userConfig = edge?.viewerResponse;
          const userInjection = userConfig?.injection;
          const kvStoreArn = userConfig?.kvStore;

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
            { parent: self },
          );
        });
      }

      function createDistribution() {
        return new Cdn(
          ...transform(
            args.transform?.cdn,
            `${name}Cdn`,
            {
              comment: `${name} app`,
              domain: args.domain,
              origins: [
                {
                  originId: "default",
                  domainName: "placeholder.sst.dev",
                  customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "http-only",
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
                cachePolicyId,
                // CloudFront's Managed-AllViewerExceptHostHeader policy
                originRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac",
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
              tags: {
                "sst:ref:kv": kvStoreArn,
                "sst:ref:kv-namespace": kvNamespace,
                "sst:ref:version": _refVersion.toString(),
              },
            },
            { parent: self },
          ),
        );
      }
    }
  }

  /**
   * The ID of the Router distribution.
   */
  public get distributionID() {
    return this.cdn.nodes.distribution.id;
  }

  /**
   * The URL of the Router.
   *
   * If the `domain` is set, this is the URL with the custom domain.
   * Otherwise, it's the autogenerated CloudFront URL.
   */
  public get url() {
    return all([this.cdn.domainUrl, this.cdn.url]).apply(
      ([domainUrl, url]) => domainUrl ?? url,
    );
  }

  /**
   * The underlying [resources](/docs/components/#nodes) this component creates.
   */
  public get nodes() {
    return {
      /**
       * The Amazon CloudFront CDN resource.
       */
      cdn: this.cdn,
    };
  }

  /**
   * Add a route to a destination URL.
   *
   * @param pattern The path pattern to match for this route.
   * @param url The destination URL to route matching requests to.
   * @param args Configure the route.
   *
   * @example
   *
   * You can match a route based on:
   *
   * - A path like `/api`
   * - A domain pattern like `api.example.com`
   * - A combined pattern like `dev.example.com/api`
   *
   * For example, to match a path.
   *
   * ```ts title="sst.config.ts"
   * router.route("/api", "https://api.example.com");
   * ```
   *
   * Or match a domain.
   *
   * ```ts title="sst.config.ts"
   * router.route("api.myapp.com/", "https://api.example.com");
   * ```
   *
   * Or a combined pattern.
   *
   * ```ts title="sst.config.ts"
   * router.route("dev.myapp.com/api", "https://api.example.com");
   * ```
   *
   * You can also rewrite the request path.
   *
   * ```ts title="sst.config.ts"
   * router.route("/api", "https://api.example.com", {
   *   rewrite: {
   *     regex: "^/api/(.*)$",
   *     to: "/$1"
   *   }
   * });
   * ```
   *
   * Here something like `/api/users/profile` will be routed to
   * `https://api.example.com/users/profile`.
   */
  public route(
    pattern: Input<string>,
    url: Input<string>,
    args?: Input<RouterUrlRouteArgs>,
  ) {
    all([pattern, args, this.hasInlineRoutes]).apply(
      ([pattern, args, hasInlineRoutes]) => {
        if (hasInlineRoutes)
          throw new VisibleError(
            "Cannot use both `routes` and `.route()` function to add routes.",
          );

        new RouterUrlRoute(
          `${this.constructorName}Route${pattern}`,
          {
            store: this.kvStoreArn!,
            routerNamespace: this.kvNamespace!,
            pattern,
            url,
            routeArgs: args,
          },
          { provider: this.constructorOpts.provider },
        );
      },
    );
  }

  /**
   * Add a route to an S3 bucket.
   *
   * @param pattern The path pattern to match for this route.
   * @param bucket The S3 bucket to route matching requests to.
   * @param args Configure the route.
   *
   * @example
   *
   * Let's say you have an S3 bucket that gives CloudFront `access`.
   *
   * ```ts title="sst.config.ts" {2}
   * const bucket = new sst.aws.Bucket("MyBucket", {
   *   access: "cloudfront"
   * });
   * ```
   *
   * You can match a pattern and route to it based on:
   *
   * - A path like `/api`
   * - A domain pattern like `api.example.com`
   * - A combined pattern like `dev.example.com/api`
   *
   * For example, to match a path.
   *
   * ```ts title="sst.config.ts"
   * router.routeBucket("/files", bucket);
   * ```
   *
   * Or match a domain.
   *
   * ```ts title="sst.config.ts"
   * router.routeBucket("files.example.com", bucket);
   * ```
   *
   * Or a combined pattern.
   *
   * ```ts title="sst.config.ts"
   * router.routeBucket("dev.example.com/files", bucket);
   * ```
   *
   * You can also rewrite the request path.
   *
   * ```ts title="sst.config.ts"
   * router.routeBucket("/files", bucket, {
   *   rewrite: {
   *     regex: "^/files/(.*)$",
   *     to: "/$1"
   *   }
   * });
   * ```
   *
   * Here something like `/files/logo.png` will be routed to
   * `/logo.png`.
   */
  public routeBucket(
    pattern: Input<string>,
    bucket: Input<Bucket>,
    args?: Input<RouterBucketRouteArgs>,
  ) {
    all([pattern, args, this.hasInlineRoutes]).apply(
      ([pattern, args, hasInlineRoutes]) => {
        if (hasInlineRoutes)
          throw new VisibleError(
            "Cannot use both `routes` and `.routeBucket()` function to add routes.",
          );

        new RouterBucketRoute(
          `${this.constructorName}Route${pattern}`,
          {
            store: this.kvStoreArn!,
            routerNamespace: this.kvNamespace!,
            pattern,
            bucket,
            routeArgs: args,
          },
          { provider: this.constructorOpts.provider },
        );
      },
    );
  }

  /**
   * Add a route to a frontend or static site.
   *
   * @param pattern The path pattern to match for this route.
   * @param site The frontend or static site to route matching requests to.
   *
   * @example
   *
   * You can add routes to a frontend (like Next.js, Remix, SvelteKit) or a static
   * site.
   *
   * Let's say you have a Next.js app with its built-in CDN disabled.
   *
   * ```ts title="sst.config.ts" "cdn: false"
   * const site = new sst.aws.Nextjs("Site", { cdn: false });
   * ```
   *
   * You can then match a pattern and route to it based on:
   *
   * - A path like `/docs`
   * - A domain pattern like `docs.example.com`
   * - A combined pattern like `dev.example.com/docs`
   *
   * For example, to match a path.
   *
   * ```ts title="sst.config.ts"
   * router.routeSite("/docs", site);
   * ```
   *
   * Or match a domain.
   *
   * ```ts title="sst.config.ts"
   * router.routeSite("docs.example.com/", site);
   * ```
   *
   * Route by both domain and path:
   *
   * ```ts title="sst.config.ts"
   * router.routeSite("dev.example.com/docs", site);
   * ```
   *
   * If you are routing to a path like `/docs`, you must configure the
   * base path in your frontend's config. The base path must match the path in your
   * route pattern.
   *
   * :::caution
   * If routing to a path, you need to configure that as the base path in your
   * frontend as well.
   * :::
   *
   * For example, if you are routing `/docs` to a Next.js app, you need to set
   * `basePath` to `/docs` in your `next.config.js`.
   *
   * ```js title="next.config.js" {2}
   * export default defineConfig({
   *   basePath: "/docs"
   * });
   * ```
   */
  public routeSite(pattern: Input<string>, site: Input<SsrSite | StaticSite>) {
    all([pattern, this.hasInlineRoutes]).apply(([pattern, hasInlineRoutes]) => {
      if (hasInlineRoutes)
        throw new VisibleError(
          "Cannot use both `routes` and `.routeSite()` function to add routes.",
        );

      new RouterSiteRoute(
        `${this.constructorName}Route${pattern}`,
        {
          store: this.kvStoreArn!,
          routerNamespace: this.kvNamespace!,
          pattern,
          site,
          distributionId: this.distributionID,
        },
        { provider: this.constructorOpts.provider },
      );
    });
  }

  /** @internal */
  public getSSTLink() {
    return {
      properties: {
        url: this.url,
      },
    };
  }

  /**
   * Reference an existing Router with the given Router distribution ID.
   *
   * @param name The name of the component.
   * @param distributionID The ID of the existing Router distribution.
   * @param opts? Resource options.
   *
   * This is useful when you create a Router in one stage and want to share it in
   * another. It avoids having to create a new Router in the other stage.
   *
   * :::tip
   * You can use the `static get` method to share a Router across stages.
   * :::
   *
   * @example
   * Let's say you create a Router in the `dev` stage. And in your personal stage
   * `frank`, you want to share the same Router.
   *
   * ```ts title="sst.config.ts"
   * const router = $app.stage === "frank"
   *   ? sst.aws.Router.get("MyRouter", "E2IDLMESRN6V62")
   *   : new sst.aws.Router("MyRouter");
   * ```
   *
   * Here `E2IDLMESRN6V62` is the ID of the Router distribution created in the
   * `dev` stage. You can find this by outputting the distribution ID in the `dev`
   * stage.
   *
   * ```ts title="sst.config.ts"
   * return {
   *   router: router.distributionID
   * };
   * ```
   */
  public static get(
    name: string,
    distributionID: Input<string>,
    opts?: ComponentResourceOptions,
  ) {
    return new Router(
      name,
      {
        ref: true,
        distributionID: distributionID,
      } as unknown as RouterArgs,
      opts,
    );
  }
}

const __pulumiType = "sst:aws:Router";
// @ts-expect-error
Router.__pulumiType = __pulumiType;

export const CF_BLOCK_CLOUDFRONT_URL_INJECTION = `
if (event.request.headers.host.value.includes('cloudfront.net')) {
  return {
    statusCode: 403,
    statusDescription: 'Forbidden',
    body: {
      encoding: "text",
      data: '<html><head><title>403 Forbidden</title></head><body><center><h1>403 Forbidden</h1></center></body></html>'
    }
  };
}`;

export const CF_ROUTER_GLOBAL_INJECTION = `
function setUrlOrigin(urlHost, override) {
  const origin = {
    domainName: urlHost,
    customOriginConfig: {
      port: 443,
      protocol: "https",
      sslProtocols: ["TLSv1.2"],
    },
    originAccessControlConfig: {
      enabled: false,
    }
  };
  override = override ?? {};
  if (override.protocol === "http") {
    delete origin.customOriginConfig;
  }
  if (override.connectionAttempts) {
    origin.connectionAttempts = override.connectionAttempts;
  }
  if (override.timeouts) {
    origin.timeouts = override.timeouts;
  }
  cf.updateRequestOrigin(origin);
}

function setS3Origin(s3Domain, override) {
  const origin = {
    domainName: s3Domain,
    originAccessControlConfig: {
      enabled: true,
      signingBehavior: "always",
      signingProtocol: "sigv4",
      originType: "s3",
    }
  };
  override = override ?? {};
  if (override.connectionAttempts) {
    origin.connectionAttempts = override.connectionAttempts;
  }
  if (override.timeouts) {
    origin.timeouts = override.timeouts;
  }
  cf.updateRequestOrigin(origin);
}`;

export const CF_SITE_ROUTER_INJECTION = `
async function routeSite(kvNamespace, metadata) {
  const baselessUri = metadata.base
    ? event.request.uri.replace(metadata.base, "")
    : event.request.uri;

  // Route to S3 asset routes
  if (metadata.s3 && metadata.s3.routes) {
    for (var i=0, l=metadata.s3.routes.length; i<l; i++) {
      const route = metadata.s3.routes[i];
      if (baselessUri.startsWith(route)) {
        event.request.uri = metadata.s3.dir + baselessUri;
        setS3Origin(metadata.s3.domain);
        return;
      }
    }
  }

  // Route to S3
  try {
    // check using baselessUri b/c files are stored in the root
    const u = decodeURIComponent(baselessUri);
    const postfixes = u.endsWith("/")
      ? ["index.html"]
      : ["", ".html", "/index.html"];
    const v = await Promise.any(postfixes.map(p => cf.kvs().get(kvNamespace + ":" + u + p).then(v => p)));
    // files are stored in a subdirectory, add it to the request uri
    event.request.uri = metadata.s3.dir + baselessUri + v;
    setS3Origin(metadata.s3.domain);
    return;
  } catch (e) {}

  // Route to S3 custom 404 (no servers)
  if (metadata.custom404) {
    event.request.uri = metadata.s3.dir + metadata.custom404;
    setS3Origin(metadata.s3.domain);
    return;
  }

  // Route to image optimizer
  if (metadata.image && baselessUri.startsWith(metadata.image.pattern)) {
    setUrlOrigin(metadata.image.host);
    return;
  }

  // Route to servers
  if (metadata.servers){
    event.request.headers["x-forwarded-host"] = event.request.headers.host;
    ${
      // Note: In SvelteKit, form action requests contain "/" in request query string
      //  ie. POST request with query string "?/action"
      //  CloudFront does not allow query string with "/". It needs to be encoded.
      ""
    }
    for (var key in event.request.querystring) {
      if (key.includes("/")) {
        event.request.querystring[encodeURIComponent(key)] = event.request.querystring[key];
        delete event.request.querystring[key];
      }
    }
    setNextjsGeoHeaders();
    setNextjsCacheKey();
    setUrlOrigin(findNearestServer(metadata.servers), metadata.origin);
  }

  function setNextjsGeoHeaders() {
    ${
      // Inject the CloudFront viewer country, region, latitude, and longitude headers into
      // the request headers for OpenNext to use them for OpenNext to use them
      ""
    }
    if(event.request.headers["cloudfront-viewer-city"]) {
      event.request.headers["x-open-next-city"] = event.request.headers["cloudfront-viewer-city"];
    }
    if(event.request.headers["cloudfront-viewer-country"]) {
      event.request.headers["x-open-next-country"] = event.request.headers["cloudfront-viewer-country"];
    }
    if(event.request.headers["cloudfront-viewer-region"]) {
      event.request.headers["x-open-next-region"] = event.request.headers["cloudfront-viewer-region"];
    }
    if(event.request.headers["cloudfront-viewer-latitude"]) {
      event.request.headers["x-open-next-latitude"] = event.request.headers["cloudfront-viewer-latitude"];
    }
    if(event.request.headers["cloudfront-viewer-longitude"]) {
      event.request.headers["x-open-next-longitude"] = event.request.headers["cloudfront-viewer-longitude"];
    }
  }

  function setNextjsCacheKey() {
    ${
      // This function is used to improve cache hit ratio by setting the cache key
      // based on the request headers and the path. `next/image` only needs the
      // accept header, and this header is not useful for the rest of the query
      ""
    }
    var cacheKey = "";
    if (event.request.uri.startsWith("/_next/image")) {
      cacheKey = getHeader("accept");
    } else {
      cacheKey =
        getHeader("rsc") +
        getHeader("next-router-prefetch") +
        getHeader("next-router-state-tree") +
        getHeader("next-url") +
        getHeader("x-prerender-revalidate");
    }
    if (event.request.cookies["__prerender_bypass"]) {
      cacheKey += event.request.cookies["__prerender_bypass"]
        ? event.request.cookies["__prerender_bypass"].value
        : "";
    }
    var crypto = require("crypto");
    var hashedKey = crypto.createHash("md5").update(cacheKey).digest("hex");
    event.request.headers["x-open-next-cache-key"] = { value: hashedKey };
  }

  function getHeader(key) {
    var header = event.request.headers[key];
    if (header) {
      if (header.multiValue) {
        return header.multiValue.map((header) => header.value).join(",");
      }
      if (header.value) {
        return header.value;
      }
    }
    return "";
  }

  function findNearestServer(servers) {
    if (servers.length === 1) return servers[0][0];

    const h = event.request.headers;
    const lat = h["cloudfront-viewer-latitude"] && h["cloudfront-viewer-latitude"].value;
    const lon = h["cloudfront-viewer-longitude"] && h["cloudfront-viewer-longitude"].value;
    if (!lat || !lon) return servers[0][0];

    return servers
      .map((s) => ({
        distance: haversineDistance(lat, lon, s[1], s[2]),
        host: s[0],
      }))
      .sort((a, b) => a.distance - b.distance)[0]
      .host;
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = angle => angle * Math.PI / 180;
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) ** 2;
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}`;
