
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
          h = $(window).height() - 120
          $("#corexml").css "height", h + 'px'


          entries.each (i,e) ->
            # The following won't work in IE. Replace with .html()?
            string = (new XMLSerializer()).serializeToString(e)

            entry = coreBuilder.Data.Core.add
              "entry" : e
              "output" : string
              "formatted" : string.replace(/</g, "&lt;").replace(/>/g, "&gt;")

            targets = {}

            $(e).find('rdg').each (i,r) ->

              src = $(r).attr("wit").substring(1)
              source = entry.sources.add 
                "source" : src

              targets[src] = []              

              ptrs = $(r).find('ptr')
              if ptrs.length > 0
                ptrs.each (i,p) ->
                  trgt = $(p).attr("target").substring(1)
                  source.selectionGroup.add
                    "xmlid" : trgt

                  targets[src].push trgt

              else
                source.set "empty", true

              entry.set targets : targets

              console.log entry

          # Show Full Core tab
          $('#tabs a[href="#full"]').tab('show')

      )(file);

      reader.readAsText(file,"UTF-8")

  coreBuilder.Components.SourceSelector = (target, data_url) ->

    $(target).multiselect
      buttonClass: 'btn'
      buttonWidth: 'auto'
      buttonContainer: '<div class="btn-group" />'
      maxHeight: 250
      onChange: (opt, adding) ->
        source = $(opt).val()
        escaped_src = source.replace(/[\?=\.]/g, '_')
        if adding
          url = data_url + '/' + source
          source = coreBuilder.Data.Sources.add 
            source: escaped_src
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
          s = coreBuilder.Data.Sources.get escaped_src
          coreBuilder.Data.Sources.remove escaped_src
          # Triggering destroy manually to remove view
          s.trigger 'destroy'
          s = null

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

  ## ROUTERS ##
  coreBuilder.Routers = {}

  class coreBuilder.Routers.GoToEditor extends Backbone.Router
    routes:
      "show/:source" : "show"
      "show/:source/:id" : "show"

    show: (s, i) ->

      move = ->
        adjustment = 115

        editor = ace.edit 'ed_'+s

        # Get focus on the editor
        editor.moveCursorTo 1,1

        punct = """["']"""
        editor.find punct+i+punct, {regExp:true}, true  

        offset = $("#ed_"+s).offset().top - adjustment

        $('html, body').animate({scrollTop: offset}, 800)

      ed = $("#ed_"+s)

      if !ed.get(0)?
        ## FIX ME
        fixeds = s.replace '_xml', '.xml'
        fixeds = fixeds.replace '_id_', '?id='
        for sel in $('.sel-sources option')
          if $(sel).val() == fixeds
            $('.sel-sources').multiselect('select', fixeds)
            setTimeout move, 100
      else
        move()

      @navigate '#'

  ## DATA ##

  coreBuilder.Data = {}

  # Models

  class Source extends Backbone.Model
    idAttribute : "source"

    defaults : 
      "group" : undefined

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

    render: =>

      if !@model.get("empty")?
        @$el.addClass 'badge'
        id = 'sel_' + @model.id.replace(/\"/g, "")
        @$el.attr 'id', id
        @$el.html @template(@model.toJSON())
      @

  class SourceView extends Backbone.View

    template: _.template $('#editor-tpl').html()

    initialize: ->
      @listenToOnce @model, 'change', @render
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
            when token.type == "entity.other.attribute-name.xml" and token.value == 'xml:id'
              # lookup id string (two tokens forward)
              xmlid = tokenRow[token.index+2].value.replace
              xmlid = xmlid.replace(/['"]/g, "")
            when token.type == "string.attribute-value.xml" and tokenRow[token.index-2].value == 'xml:id'
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
      @$el.html @template(@model.toJSON())

      # Need to append the element to the DOM here
      # so that ace can be initialized.
      $("#editors").append @$el

      @editor = ace.edit "ed_" + @model.get("source")
      @editor.setReadOnly(true)
      @editor.setTheme("ace/theme/monokai")
      @editor.getSession().setMode("ace/mode/xml")
      @editor.getSession().insert({column:0, row:0}, @model.get "text")          
      @editor.moveCursorTo({column:0, row:0})

      @bindSelect()

      @$el.append(new SelectionGroupView({collection : @model.selectionGroup}).el)

      (new GroupingView
        model: @model
        el: @$el.find('.groupingView')
      ).render()

    remove: ->
      @editor.destroy() # Not sure whether this actually does anything
      $(@el).empty().remove()
      @


  class GroupingView extends Backbone.View

    template: _.template $('#grouping-tpl').html()

    events:
      "click .add-empty" : "addEmpty"
      "click .newGroup" : "newGroup"
      "click .removeFromGroup" : "removeFromGroup"
      "click ._group" : "addToGroup"

    initialize: ->
      @listenTo @model.collection, "change", =>
        @render()

    newGroup: (e) ->
      e.preventDefault()
      e.stopPropagation()

      groups = []
      @model.collection.each (sel) ->
        g = sel.get("group")
        groups.push(g) if g? 
      if groups.length == 0
        groups = [0]
      latestGroup = Math.max.apply @, groups

      @model.set "group", latestGroup + 1

      console.log "added to new group", latestGroup + 1

      @model.collection.trigger "coll:change"

    removeFromGroup: (e) ->
      e.preventDefault()
      e.stopPropagation()

      console.log "removed from group", @model.get("group")

      @model.set "group", undefined

    addToGroup: (e) ->
      e.preventDefault()
      e.stopPropagation()

      g = $(e.target).data("group")

      @model.set "group", g
      console.log 'added to group', g

    render: ->

      groups = []
      @model.collection.each (sel) ->
        g = sel.get("group")
        groups.push(g) if g? and g not in groups

      adjustedModel = @model.toJSON()
      adjustedModel["groups"] = groups
      adjustedModel["start"] = if @model.get("group")? then false else true
      adjustedModel["remove"] = !adjustedModel.start

      @$el.html @template(adjustedModel)


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

    addEntry: ->
      
      targets = {}
      for r in @collection.models 
        source = r.get("source")
        targets[source] = []
        for sg in r.selectionGroup.models
          targets[source].push sg.get("xmlid")
        r.set "group", undefined

      entry = coreBuilder.Data.Core.add
        "entry" : @toDOM()
        "formatted" : @toXMLString(true)
        "output" : @toXMLString(false)
        "targets" : targets

      console.log entry

      entry.sources = @collection
      entry.trigger 'sync'
      @remove()
      msg = $ '<div class="alert alert-success fade in">Added!</div>'
      @$el.html msg
      $(msg).alert()
      window.setTimeout (-> $(msg).alert('close')), 500

    toDOM: ->
      grps = {}
      entry = $("<app>")
      for r in @collection.models 
        if r.selectionGroup?.length > 0
          sel = $("<rdg>").attr
            "wit" : '#' + r.get("source")
          if r.get("group")
            grpNum = r.get("group")
            if grpNum of grps
              grps[grpNum].push(sel)
            else
              grps[grpNum] = [sel]
          else
            entry.append sel
          for p in r.selectionGroup.models
            # sel.text('<!-- empty -->') if p.get("empty")?
            if p.get("xmlid")?.length > 0
              ptr = $("<ptr>").attr
                "target" : '#' + p.get("xmlid")
              sel.append ptr
      
      for k of grps
        grp = $("<rdgGrp>")
        grp.attr("n", k)
        for g in grps[k] 
          entry.append grp
          grp.append g
      entry

    toXMLString: (escape) ->
      xml_string = vkbeautify.xml(@toDOM().wrap('<s>').parent().html())
      if escape
        xml_string = xml_string.replace(/</g, '&lt;')
        xml_string = xml_string.replace(/>/g, '&gt;')
      xml_string

    initialize: ->
      @listenTo @collection, 'add', @addOne
      @

    addOne: (model) ->
      @listenTo model.selectionGroup, 'add', @render
      @listenTo model.selectionGroup, 'remove', @render
      @listenTo model, 'change', @render
      @

    render: ->
      @$el.empty()
      sources = []
      for r in @collection.models
        if r.selectionGroup?.length > 0
          sources.push r.get("source")

      if sources.length > 0
        @$el.html @template
          xml_string : @toXMLString(true)
          sources : sources

        # Highlight
        Prism.highlightElement(@$el.find('code')[0])

        # Link targets
        for r in @collection.models

          source = r.get("source")

          for sg in r.selectionGroup.models
            id = sg.get "xmlid"
            check_id = if id?.slice(0,1) != '#' then '#' + id else id
            attrs = @$el.find('.token.attr-name')
            for att in attrs
              if $(att).text() == 'target'
                target = $(att).next().contents().filter( -> @nodeType != 1)
                if target.text() == check_id
                  if source.slice(0,1) == '#' then source = source.slice(1)
                  if id.slice(0,1) == '#' then id = id.slice(1)
                  target.wrap "<a href='#show/"+source+"/"+id+"''></a>"
      @

    remove: ->
      @collection.each (c) ->
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
        @$el.append (new FullCoreEntryView(model : entry)).delegateEvents().render().el
      @

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

      linkTargets = =>
        # Highlight
        Prism.highlightElement(@$el.find('code')[0])

        targets = @model.get "targets"
        for source of targets
          for id in targets[source]
            check_id = if id?.slice(0,1) != '#' then '#' + id else id
            attrs = @$el.find('.token.attr-name')
            for att in attrs
              if $(att).text() == 'target'
                target = $(att).next().contents().filter( -> @nodeType != 1)
                if target.text() == check_id
                  if source.slice(0,1) == '#' then source = source.slice(1)
                  if id.slice(0,1) == '#' then id = id.slice(1)
                  target.wrap "<a href='#show/"+source+"/"+id+"''></a>"

      if @model.sources.length > 0
        linkTargets()
      else
        @listenToOnce @model, 'sync', ->
          linkTargets()
      @

    remove: ->
      @model.collection.remove @model
      @

  class coreBuilder.App extends Backbone.View

    el: "#coreBuilder"

    events:
      "click #downloadCore": "download"

    initialize: (options) ->
      # Start history and routers
      Backbone.history.start()
      new coreBuilder.Routers.GoToEditor

      # Bind UI components
      coreBuilder.Components.SourceSelector '.sel-sources', options["data_url"]
      coreBuilder.Components.FileUploader '#uploadCore'
      coreBuilder.Components.CoreTabs '#tabs'

      # Start Sources View
      new SourcesView collection: coreBuilder.Data.Sources
      # Start Core Entry View on the same data
      new CoreEntryView collection: coreBuilder.Data.Sources
      # Start Core View on the same data
      fcv = new FullCoreView collection: coreBuilder.Data.Core
      $("#full").html fcv.$el
      h = $(window).height() - 120
      $("#corexml").css "height", h + 'px'

      @render()

    download: ->
      xml = "<core>"
      coreBuilder.Data.Core.each (e,i) ->
        xml += e.get("output")
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