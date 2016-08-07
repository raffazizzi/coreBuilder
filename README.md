<a href="http://raffazizzi.github.io/coreBuilder/">
    <img src="https://raw.githubusercontent.com/raffazizzi/coreBuilder/v2/images/logo.png" alt="coreBuilder logo" title="coreBuilder" align="left" height="60" />
</a>

# coreBuilder

Core Builder is a tool to create XML stand-off markup, particularly tailored to TEI documents.

With this tool you can:

* Set a custom set of stand-off elements, or choose from a pre-set list
* Load XML files into text editors (upload, or from the web)
* Click on elemens with ids to build stand-off entries and add them to a downloadable "core" file
* Create XPointer expressions by selection text directly on the XML file

**Check out the [live app](http://raffazizzi.github.io/coreBuilder) and read the [wiki](wiki) for more examples.**

## Building coreBuilder
<a href="#" id="status-image-popup" title="build status image" name="status-images" class="open-popup" data-ember-action="1090">
            <img src="https://travis-ci.org/TEIC/CETEIcean.svg" alt="build:passed">
          </a>

If you want to run your own instance of coreBuilder, you'll have to buil the JavaScript code.

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