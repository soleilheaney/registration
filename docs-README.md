# SST and TanStack Router Documentation References

This repository contains symbolic links to documentation and component code from SST and TanStack Router projects for easy reference.

## Folder Structure

- `sst-aws-components/` - Symbolic link to SST AWS components
- `tanstack-router-start-docs/` - Symbolic link to TanStack Router getting started documentation

## Setup Commands

The following commands were used to set up this repository:

```bash
# Create the main directory
mkdir -p /Users/austinwallace/dev/sst-tanstack-docs

# Create symbolic links to the target directories
ln -s /Users/austinwallace/dev/sst/platform/src/components/aws /Users/austinwallace/dev/sst-tanstack-docs/sst-aws-components
ln -s /Users/austinwallace/dev/router/docs/start /Users/austinwallace/dev/sst-tanstack-docs/tanstack-router-start-docs
```

## Updating the Code

To update the code in either linked directory:

1. Change to the original repository:
   ```bash
   # For SST
   cd /Users/austinwallace/dev/sst
   git pull

   # For TanStack Router
   cd /Users/austinwallace/dev/router
   git pull
   ```

2. The symbolic links will automatically point to the updated code.