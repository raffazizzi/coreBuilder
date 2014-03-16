
root = this

root.coreBuilder = {}

(($,coreBuilder,_,Backbone,ace) -> 

  ## Utils

  coreBuilder.Utils = {}

  coreBuilder.Utils.generateUid = (separator) ->

    delim = if separator? then separator else "-"

    S4 = () ->
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

    return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());

  ## UI components

  coreBuilder.Components = {}

  coreBuilder.Components.FileUploader = (target) ->

    $(target).change (e) ->

      file = e.target.files[0]

      reader = new FileReader()

      reader.onload = ( (theFile) ->
        return (e) ->
          parser = new DOMParser()
          XMLCore = parser.parseFromString e.target.result, "text/xml"
          entries = $(XMLCore).find('app')

          # Start Core Entry View on the same data
          new CoreEntryView collection: coreBuilder.Data.Sources
          # Start Core View on the same data
          fcv = new FullCoreView collection: coreBuilder.Data.Core
          $("#full").html fcv.$el

          entries.each (i,e) ->
            # The following won't work in IE. Replace with .html()?
            string = (new XMLSerializer()).serializeToString(e)

            entry = coreBuilder.Data.Core.add
              "entry" : string
              "formatted" : string

            $(e).find('rdg').each (i,r) ->
              source = entry.sources.add 
                "source" : $(r).attr("wit")

              ptrs = $(r).find('ptr')
              if ptrs.length > 0
                ptrs.each (i,p) ->
                  source.selectionGroup.add
                    "xmlid" : $(p).attr("target")
                    # ident ?
                    # pos ?
              else
                source.set "empty", true

          # Highlight
          Prism.highlightAll()

          # Show Full Core tab
          $('#tabs a[href="#full"]').tab('show')

      )(file);

      reader.readAsText(file,"UTF-8")

  coreBuilder.Components.SourceSelector = (target) ->

    $(target).multiselect
      buttonClass: 'btn'
      buttonWidth: 'auto'
      buttonContainer: '<div class="btn-group" />'
      maxHeight: false
      onChange: (opt, adding) ->
        source = $(opt).val()
        if adding
          url = 'data/' + source + '.xml'
          source = coreBuilder.Data.Sources.add
            source: source
            url: url
          $.get(url, (data) ->
            parser = new DOMParser() 
            xmlDoc = parser.parseFromString data,"text/xml"
            source.set 
              text : data
              xmldata : xmlDoc
            # Get title, too and other data-related stuff
            # so that the model can be mapped to a template in the view.
          , 'text')
        else
          s = coreBuilder.Data.Sources.get source
          coreBuilder.Data.Sources.remove source
          # Triggering destroy manually to remove view
          s.trigger 'destroy'

      buttonText: (options) ->

        sel = []

        if options.length > 0
          options.each ->
            source_id = $(@).text()
            sel.push source_id  

        if sel.length == 0
          return 'Sources <b class="caret"></b>'

        label = sel.join(", ")
        label = label.substring(0,50) + "..." if label.length > 50

        return label + ' <b class="caret"></b>'

  coreBuilder.Components.CoreTabs = (target) ->

    $(target).click (e) ->
      e.preventDefault()
      $(this).tab('show')

  ## DATA ##

  coreBuilder.Data = {}

  # Models

  class Source extends Backbone.Model
    idAttribute : "source"

    # Using initialize instead of defaults for nested collections
    # is recommended by the Backbone FAQs:
    # http://documentcloud.github.io/backbone/#FAQ-nested
    initialize : ->
      @selectionGroup = new SelectionGroup

  class CoreEntry extends Backbone.Model
    initialize : ->
      @sources = new Sources

  class Selection extends Backbone.Model
    idAttribute : "xmlid"

  # Collections

  class Sources extends Backbone.Collection
    model: Source

  class SelectionGroup extends Backbone.Collection
    model: Selection

  class Core extends Backbone.Collection
    model: CoreEntry

  # Expose Collections
  coreBuilder.Data.Sources = new Sources
  coreBuilder.Data.Core = new Core

  ## VIEWS ##

  coreBuilder.Views = {}

  class SelectionGroupView extends Backbone.View

    initialize: ->
      @listenTo @collection, 'add', @addOne
      @listenTo @collection, 'remove', @removeOne

    addOne: (m) ->
      @$el.append new SelectionView(model:m).render().el
      @

    removeOne: (m) ->
      if !m.get("empty")?
        id = '#sel_' + m.id.replace(/\"/g, "")
        $(id).remove()
      @

  class SelectionView extends Backbone.View

    tagName: 'span'

    template: _.template $('#selection-tpl').html()

    events:
      'click .sel-remove': 'removeOne'

    removeOne: =>
      @model.collection.remove @model.id, silent:false

    render: ->
      if !@model.get("empty")?
        @$el.addClass 'badge'
        id = 'sel_' + @model.id.replace(/\"/g, "")
        @$el.attr 'id', id
        @$el.html @template(@model.toJSON())
      @

  class SourceView extends Backbone.View

    template: _.template $('#editor-tpl').html()

    initialize: ->
      @listenTo @model, 'change', @render
      @listenTo @model, 'destroy', @remove

    tagName: 'div'

    events:
      "click .add-empty" : "addEmpty"

    addEmpty: (e) ->
      # Flush existing selections
      @model.selectionGroup.each (s) =>
        @model.selectionGroup.remove s
      $(e.target).addClass "disabled"
      @model.selectionGroup.add
        empty: true
      @listenTo @model.selectionGroup, 'remove', (m) ->
        if m.get('empty')?
          $(e.target).removeClass "disabled"

    bindSelect: ->

      $(@editor.container).click (e) =>
        e.stopPropagation()

        # Remove any element selectors
        $("#el_select").remove()

        pos = @editor.getCursorPosition()
        token = @editor.session.getTokenAt(pos.row, pos.column)
        tokenRow = @editor.session.getTokens pos.row
        if token?
          switch
            when token.type == "entity.other.attribute-name" and token.value == 'xml:id'
              # lookup id string (two tokens forward)
              xmlid = tokenRow[token.index+2].value.replace
              xmlid = xmlid.replace(/['"]/g, "")
            when token.type == "string" and tokenRow[token.index-2].value == 'xml:id'
              # check this is an xml:id attribute vaule (two tokens back)
              xmlid = token.value
              xmlid = xmlid.replace(/["']/g, "")

        if xmlid?
          xmldata = $(@model.get "xmldata")
          find_q = "*[xml\\:id=" +xmlid+ "]" 
          xmlel = xmldata.find(find_q)
          
          tagName = xmlel.prop("tagName")
          popup = $('<button type="button" class="btn btn-default" id="el_select">' + tagName + '</button>')
          popup.css 
            'position' : 'absolute'
            'left' : e.pageX
            'top' : e.pageY
            'z-index': 999
          $('html').append popup

          popup.click (e) =>
            e.stopPropagation()
            @model.selectionGroup.add
              ident : tagName
              xmlid : xmlid
              pos   : pos
            popup.remove()

    render: ->
      $el = $(@el)

      $el.html @template(@model.toJSON())

      # Need to append the element to the DOM here
      # so that ace can be initialized.
      $("#editors").append $el

      @editor = ace.edit "ed_" + @model.get("source")
      @editor.setReadOnly(true)
      @editor.setTheme("ace/theme/monokai")
      @editor.getSession().setMode("ace/mode/xml")
      @editor.getSession().insert({column:0, row:0}, @model.get "text")          
      @editor.moveCursorTo({column:0, row:0})

      @bindSelect()

      $el.append(new SelectionGroupView({collection : @model.selectionGroup}).el)

    remove: ->
      $(@el).remove()
      @


  class SourcesView extends Backbone.View

    initialize: (collection) ->
      @listenTo @collection, 'add', @addOne

    addOne: (model) ->
      new SourceView model: model

  class CoreEntryView extends Backbone.View

    el: '#cur_entry'

    template: _.template $('#core-tpl').html()

    events: 
      "click #entry_add"     : "addEntry"
      "click #entry_cancel"  : "remove"
      "click #entry_group li": "group"

    addEntry: ->
      entry = coreBuilder.Data.Core.add
        "entry" : @toDOM()
        "formatted" : @toXMLString()
      entry.sources = @collection
      @remove()
      msg = $ '<div class="alert alert-success fade in">Added!</div>'
      @$el.html msg
      $(msg).alert()
      window.setTimeout (-> $(msg).alert('close')), 500

    toDOM: ->
      grp = null
      entry = $("<app>")
      for r in @collection.models 
        if r.selectionGroup?.length > 0
          sel = $("<rdg>").attr
            "wit" : r.get("source")
          if r.get("grouped") 
            if !grp?
              grp = $("<rdgGrp>") 
              entry.append grp
            grp.append sel
          else
            entry.append sel
          for p in r.selectionGroup.models
            # sel.text('<!-- empty -->') if p.get("empty")?
            if p.get("xmlid")?.length > 0
              ptr = $("<ptr>").attr
                "target" : p.get("xmlid")
              sel.append ptr
      entry

    toXMLString: ->
      xml_string = vkbeautify.xml(@toDOM().wrap('<s>').parent().html())
      xml_string = xml_string.replace(/</g, '&lt;')
      xml_string = xml_string.replace(/>/g, '&gt;')

    initialize: ->
      @listenTo @collection, 'add', @addOne
      @

    group: (e) ->
      source = $(e.target).data().source
      model = @collection.find (m) ->
        m.get("source") == source
      model.set
          "grouped" : true
      @render()

    addOne: (model) ->
      @listenTo model.selectionGroup, 'add', @render
      @listenTo model.selectionGroup, 'remove', @render
      @

    render: ->

      sources = []
      for r in @collection.models
        if r.selectionGroup?.length > 0
          sources.push r.get("source")

      @$el.html @template
        xml_string : @toXMLString()
        sources : sources

      # Highlight
      Prism.highlightAll()
      @

    remove: ->
      @collection.each (c) ->
        if c.get('grouped') then c.set 'grouped', false
        c.selectionGroup.each (s) ->
          c.selectionGroup.remove s
      @$el.empty()
      @

  class FullCoreView extends Backbone.View

    initialize: ->
      @listenTo @collection, 'add', @render
      @listenTo @collection, 'remove', @render
      @

    render: ->
      @$el.empty()
      @collection.each (entry) =>
        fcev = new FullCoreEntryView(model : entry)
        fcev.delegateEvents()
        @$el.append fcev.render()

        # Highlight
        Prism.highlightAll()

  class FullCoreEntryView extends Backbone.View

    template: _.template $('#entry-tpl').html()

    tagName: 'pre'

    events:
      "click .close" : "remove"

    render: ->
      xml_string = @model.get("formatted")
      xml_string = xml_string.replace(/</g, '&lt;')
      xml_string = xml_string.replace(/>/g, '&gt;')
      @$el.html @template(escaped_xml : xml_string)

    remove: ->
      @model.collection.remove @model
      @

  class coreBuilder.App extends Backbone.View

    el: "#coreBuilder"

    events:
      "click #downloadCore": "download"

    initialize: ->
      # Bind UI components
      coreBuilder.Components.SourceSelector '.sel-sources'
      coreBuilder.Components.FileUploader '#uploadCore'
      coreBuilder.Components.CoreTabs '#tabs'
      
      # Start Sources View
      new SourcesView collection: coreBuilder.Data.Sources
      # Start Core Entry View on the same data
      new CoreEntryView collection: coreBuilder.Data.Sources
      # Start Core View on the same data
      fcv = new FullCoreView collection: coreBuilder.Data.Core
      $("#full").html fcv.$el

      @render()

    download: ->
      xml = "<core>"
      coreBuilder.Data.Core.each (e,i) ->
        xml += e.get("entry")
      xml += "</core>"

      bb = new Blob [xml], "type":"text\/xml"
      saveAs(bb, 'core.xml')

    render: ->
      # Intructions popover
      $('#uploadCore').popover
        'content' : 'Pick a source to start selecting elements, or upload an existing Core file.'
        'title' : 'Getting Started'
        'placement' : 'bottom'
        'trigger' : 'manual'
        'container' : '#sources'
      $('#uploadCore').popover('show')

      $('body').one "click", ->
        $('#uploadCore').popover('hide')

)(jQuery,coreBuilder,_,Backbone,ace)