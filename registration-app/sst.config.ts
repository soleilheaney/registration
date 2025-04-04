/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sports-reg-platform",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: input.stage === "production" ? "soleil-production" : "soleil-dev"
        }
      }
    };
  },
  async run() {
    new sst.aws.TanStackStart("MyWeb");
  },
});
