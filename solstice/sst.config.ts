// Disable the next line's warning since it's part of the SST platform
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "solstice",
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
    const vpc = new sst.aws.Vpc("SolsticeVpc");
    
    const postgres = new sst.aws.Postgres("SolsticeDB", {
      vpc,
      version: "16.4",
      storage: "20 GB",
      dev: {
        username: "postgres",
        password: "postgres",
        database: "solstice",
        host: "localhost",
        port: 5432
      }
    });
    
    new sst.aws.TanStackStart("MyWeb", {
      link: [postgres]
    });
  },
});
