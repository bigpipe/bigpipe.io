```
DEPRECATION WARNING:

We are moving away from this bigpipe.io project towards a fully github and git based 
documentation site which will be hosted through GitHub pages so we can more easily 
update and deploy the documentation site. The new project lives in:

https://github.com/bigpipe/bigpipe.github.io
```

# bigpipe.io

This is the site that runs on `bigpipe.io`. Which is basically a bunch of pagelets that
render the `README` files of all our sub repositories and places them a simple and
readable single page with some nice custom styling.

## Installation

Clone git repository, this project is not released in to npm as it serves no purpose as
an module.

## Deploying

The site is running on Nodejitsu, if you want to run this site your self you simply have
to update the `subdomain` property in the `package.json` as we already use it for this
site and run:

```
jitsu deploy
```

To get it running on the platform.

## License

This site is released under MIT
