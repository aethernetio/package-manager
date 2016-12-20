# AethOS Package Manager

Node library for downloading and installing AethOS software.  This package manager is based loosely on the Debian package manager.

## Why not npm?

We need a way to keep safe, sandboxed software separate from the core AethOS implementation.

The sandboxes / containers have strict controls over the API's accessible to each application, whereas node.js and npm allows anything.

Using a separate package manager gives us the flexibility to install applications according to the directory structure we require in order to maintain code separation and sandbox security.
