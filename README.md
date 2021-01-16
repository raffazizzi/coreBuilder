<a href="http://raffazizzi.github.io/coreBuilder/">
    <img src="https://raw.githubusercontent.com/raffazizzi/coreBuilder/v2/images/logo.png" alt="coreBuilder logo" title="coreBuilder" align="left" height="60" />
</a>

# coreBuilder

coreBuilder is a tool for creating XML stand-off markup, particularly tailored to TEI documents.

With this tool you can:

* Set a custom set of stand-off elements, or choose from a pre-set list
* Load XML files into text editors (upload, or from the web)
* Click on elements with ids to build stand-off entries and add them to a downloadable "core" file
* Create XPointer expressions by selecting text directly on the XML file

**Check out the [live app](http://raffazizzi.github.io/coreBuilder) and read the [wiki](https://github.com/raffazizzi/coreBuilder/wiki) for more examples.**

## Building coreBuilder
[![Build Status](https://travis-ci.com/dylan275/coreBuilder.svg?branch=master)](https://travis-ci.com/dylan275/coreBuilder)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=dylan275_coreBuilder&metric=alert_status)](https://sonarcloud.io/dashboard?id=dylan275_coreBuilder)

If you want to run your own instance of coreBuilder, you'll have to build the JavaScript code.

You'll need [nodejs](https://nodejs.org/en/) and [Gulp](http://gulpjs.com/). 
Once you have node, Gulp can be installed with:

```shell
npm i -g gulp
```

Then, to compile and run the code:

```shell
npm i
gulp
```
## Develop

If you'd like to contribute, check out the [issues](issues). You can run a development server that watches and recompiles on the fly with:

```shell
gulp run
```
