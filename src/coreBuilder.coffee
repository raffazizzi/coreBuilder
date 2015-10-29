
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

              entry.trigger 'sync'

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
          return 'Load TEI'

        label = sel.join(", ")
        label = label.substring(0,50) + "..." if label.length > 50

        return label

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

  class Attribute extends Backbone.Model
    toJSON: ->
      atts = _.clone(@attributes);
      atts["id"] = @cid
      atts
  
  class Attributes extends Backbone.Collection
    model: Attribute

  class Element extends Backbone.Model
    initialize : ->
      @atts = new Attributes

  class ElementSet extends Backbone.Model
    defaults:
      "wrapper" : new Element {"name": "app"}
      "grp" : new Element {"name": "rdgGrp"}
      "container" : new Element {"name": "rdg"}
      "ptr" : new Element {"name": "ptr"}

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
  coreBuilder.Data.ElementSet = new ElementSet
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
        $("#el_sel_grp").remove()

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
      @editor.setTheme("ace/theme/chrome")
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

    canGroup: ->
      grp = coreBuilder.Data.ElementSet.get("grp")
      if !grp?
        console.log "You must set a grouping element to be able to group."
        false
      else
        true

    newGroup: (e) ->
      e.preventDefault()
      e.stopPropagation()
      if @canGroup()
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
      if @canGroup()
        console.log "removed from group", @model.get("group")

        @model.set "group", undefined

    addToGroup: (e) ->
      e.preventDefault()
      e.stopPropagation()

      if @canGroup()

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

      entry = coreBuilder.Data.Core.add
        "entry" : @toDOM()
        "formatted" : @toXMLString(true)
        "output" : @toXMLString(false)
        "targets" : targets

      # Now reset groups
      for r in @collection.models 
        r.set "group", undefined

      entry.sources = @collection
      entry.trigger 'sync'
      @remove()
      msg = $ '<div class="alert alert-success fade in">Added!</div>'
      @$el.html msg
      $(msg).alert()
      window.setTimeout (-> $(msg).alert('close')), 500

    toDOM: ->

      # Needs refactoring

      grps = {}
      wrapper_model = coreBuilder.Data.ElementSet.get("wrapper")
      grp_model = coreBuilder.Data.ElementSet.get("grp")
      container_model = coreBuilder.Data.ElementSet.get("container")
      ptr_model = coreBuilder.Data.ElementSet.get("ptr")

      entry = $("<"+wrapper_model.get("name")+">")
      for r in @collection.models 
        if r.selectionGroup?.length > 0

          if container_model?
            sel = $("<"+container_model.get("name")+">").attr
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
              console.log r.selectionGroup.models
              # sel.text('<!-- empty -->') if p.get("empty")?
              if p.get("xmlid")?.length > 0
                ptr = $("<"+ptr_model.get("name")+">")
                for att in ptr_model.atts.models
                  compiled = {}
                  isTarget = att.get("target")
                  if isTarget
                    compiled[att.get("name")] = '#' + p.get("xmlid") 
                    ptr.attr compiled
                  else
                    compiled[att.get("name")] = att.get("value")
                    ptr.attr compiled
                sel.append ptr            

          else
            ptrs = []
            for p in r.selectionGroup.models
              if p.get("xmlid")?.length > 0
                ptr = $("<"+ptr_model.get("name")+">").attr
                  "target" : '#' + p.get("xmlid")
                ptrs.push ptr  
            if r.get("group")
              grpNum = r.get("group")
              if grpNum of grps
                grps[grpNum].concat(sel)
              else
                grps[grpNum] = ptrs
            else
              for p in ptrs
                entry.append p

      if grp_model?
        for k of grps
          grp = $("<"+grp_model.get("name")+">")
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
        c.set("group", undefined)
        while model = c.selectionGroup.first()
          c.selectionGroup.remove model
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

  class ElementSetView extends Backbone.View

    el: "#el_opts" 

    events:
      "click #apply_els" : "apply"

    initialize: ->
      super
      # A lot of this is inelegant - fix

      @$el.find('.preset').each (i, preset) =>
        $preset = $(preset)
        wrapper_name = $preset.data("wrapper")
        grp_name = $preset.data("grp")
        container_name = $preset.data("container")
        ptr_name = $preset.data("ptr")

        # These won't work: need to restructure this using a single Element model
        # setToNone = (inp, name) =>
        #   inp.val "None"
        #   inp.prop('disabled', true)
        #   to_remove = {}
        #   to_remove[name] = null
        #   @model.set to_remove
        #   # @model.get("grp").destroy()
        #   destroyViews[name]()
        #   $x = inp.prev().find('a')
        #   $x.addClass('off')
        #   $x.removeClass('on')

        # restore = (inp, name, val) =>
        #   console.log val
        #   inp.prop('disabled', false)
        #   $x = inp.prev().find('a')
        #   $x.addClass('on')
        #   $x.removeClass('off')
        #   # create new element
        #   to_create = {}
        #   to_create[name] = new Element
        #   to_create[name].set "name" : val
        #   console.log val, to_create[name]
        #   @model.set to_create
        #   new_att_view(name)

        $preset.click (e) =>
          e.preventDefault()
          $inp_w = $("#wrapper")
          if wrapper_name?
            $inp_w.val wrapper_name
            $inp_w.prop('disabled', false)
            $x = $inp_w.prev().find('a')
            $x.addClass('on')
            $x.removeClass('off')
            # create new element
            to_remove = {}
            to_remove["wrapper"] = null
            @model.set to_remove
            destroyViews["wrapper"]()
            to_create = {}
            to_create["wrapper"] = new Element
            to_create["wrapper"].set "name" : wrapper_name
            @model.set to_create
            new_att_view("wrapper")
          else
            $inp_w.val "None"
            $inp_w.prop('disabled', true)
            to_remove = {}
            to_remove["wrapper"] = null
            @model.set to_remove
            destroyViews["wrapper"]()
            $x = $inp_w.prev().find('a')
            $x.addClass('off')
            $x.removeClass('on')
          
          $inp_g = $("#grp")
          if grp_name?
            $inp_g.val grp_name
            $inp_g.prop('disabled', false)
            $x = $inp_g.prev().find('a')
            $x.addClass('on')
            $x.removeClass('off')
            # create new element
            to_create = {}
            to_create["grp"] = new Element
            to_create["grp"].set "name" : grp_name
            @model.set to_create
            new_att_view("grp")
          else
            $inp_g.val "None"
            $inp_g.prop('disabled', true)
            to_remove = {}
            to_remove["grp"] = null
            @model.set to_remove
            destroyViews["grp"]()
            $x = $inp_g.prev().find('a')
            $x.addClass('off')
            $x.removeClass('on')

          $inp_c = $("#container")
          if container_name?
            $inp_c.val container_name
            $inp_c.prop('disabled', false)
            $x = $inp_c.prev().find('a')
            $x.addClass('on')
            $x.removeClass('off')
            # create new element
            to_create = {}
            to_create["container"] = new Element
            to_create["container"].set "name" : container_name
            @model.set to_create
            new_att_view("container")

          else
            $inp_c.val "None"
            $inp_c.prop('disabled', true)
            to_remove = {}
            to_remove["container"] = null
            @model.set to_remove
            destroyViews["container"]()
            $x = $inp_c.prev().find('a')
            $x.addClass('off')
            $x.removeClass('on')

          $inp_p = $("#ptr")
          if ptr_name?
            $inp_p.val ptr_name
            $inp_p.prop('disabled', false)
            $x = $inp_p.prev().find('a')
            $x.addClass('on')
            $x.removeClass('off')
            # create new element
            to_create = {}
            to_create["ptr"] = new Element
            to_create["ptr"].set "name" : ptr_name
            @model.set to_create
            new_att_view("ptr")
          else
            $inp_p.val "None"
            $inp_p.prop('disabled', true)
            to_remove = {}
            to_remove["ptr"] = null
            @model.set to_remove
            destroyViews["ptr"]()
            $x = $inp_p.prev().find('a')
            $x.addClass('off')
            $x.removeClass('on')

          # and apply
          @apply()

      @attViews = {}

      new_att_view = (name) =>
        if name == "ptr"
          @attViews[name] = new AttributesView 
            collection: @model.get(name).atts
            el: "#att-"+name
            defaults: 
              "atts": []
              "target_att": "target"
        else
          @attViews[name] = new AttributesView 
            collection: @model.get(name).atts
            el: "#att-"+name
        @attViews[name]

      new_att_view("wrapper")
      new_att_view("grp")
      new_att_view("container")
      new_att_view("ptr")

      destroyViews = 
        "wrapper" : @attViews["wrapper"].close
        "grp" : @attViews["grp"].close
        "container" : @attViews["container"].close
        "ptr" : @attViews["ptr"].close

      @$el.find(".input-group").each (i,ig) =>
        $ig = $(ig)
        m = @model
        $ig.find('.remove').each (i,x) ->
          $x = $(x)
          $x.click (e) ->
            e.preventDefault()
            $inp = $ig.find("input")
            id = $inp.attr("id")
            el = m.get(id)
            if $x.hasClass 'on'
              $inp.val "None"
              $inp.prop('disabled', true)
              $x.addClass('off')
              $x.removeClass('on')
              # kill element model
              to_remove = {}
              to_remove[id] = null
              m.set to_remove
              el.destroy()
              destroyViews[id]()
            else 
              $inp.val ""
              $inp.prop('disabled', false)
              $x.addClass('on')
              $x.removeClass('off')
              # create new element
              to_create = {}
              to_create[id] = new Element
              m.set to_create
              new_att_view(id)

      @model.get("wrapper").set
        "name" : $("#wrapper").val()
      @model.get("grp").set
        "name" : $("#grp").val()
      @model.get("container").set
        "name" : $("#container").val()
      @model.get("ptr").set
        "name" : $("#ptr").val()

    apply: ->
      $("#apply_els").click (e) =>
        e.preventDefault()
        coreBuilder.Data.ElementSet.get("wrapper").set
          "name" : $("#wrapper").val()
        @attViews["wrapper"].updateCollection()
        if coreBuilder.Data.ElementSet.get("grp")?
          coreBuilder.Data.ElementSet.get("grp").set
            "name" : $("#grp").val()
          @attViews["grp"].updateCollection()
        if coreBuilder.Data.ElementSet.get("container")?
          coreBuilder.Data.ElementSet.get("container").set
            "name" : $("#container").val()
          @attViews["container"].updateCollection()
        coreBuilder.Data.ElementSet.get("ptr").set
          "name" : $("#ptr").val()
        @attViews["ptr"].updateCollection()

  class AttributesView extends Backbone.View

    events:
      "click .add_att": "addClick"

    template: _.template $('#atts-tpl').html()

    initialize: (options) ->

      @for_el = "for-" + @$el.attr("id")
      @subviews = []

      @render()

      if options.defaults?

        if options.defaults.atts?
          for d in options.defaults.atts
            @addOne(d, null)

        if options.defaults.target_att?
          @addOne(options.defaults.target_att, null, true)

    addClick: (e) ->
      e.preventDefault()
      @addOne()

    addOne: (name="", value="", target=false)->
      att = @collection.add
        "name": name
        "value": null
        "target": target

      @renderOne(att)

    renderOne: (att) ->
      app_view = new AttributeView
        model: att
        el: $("#"+@for_el)
      @subviews.push app_view
      app_view.render()

    render: ->
      @$el.html @template
        "name": @for_el

    updateCollection: ->
      for app_view in @subviews
        app_view.updateModel()

    close: =>
      for app_view in @subviews
        app_view.close()
      @$el.empty()
      @unbind()

  class AttributeView extends Backbone.View

    template: _.template $('#att-tpl').html()

    close: ->
      @att_el.remove()
      @unbind()
      @model.destroy()

    updateModel: =>
      @model.set
        "name": @att_el.find('.app_name').val()
        "value": @att_el.find('.app_value').val()

    render: ->
      att = @model.toJSON()
      att["id"] = @model.cid

      @att_el = $(@template(att))
      @att_el.find('.rem_att').click (e) =>
        e.preventDefault()
        @close()

      @$el.append @att_el

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

      # Start elements selection view
      new ElementSetView model: coreBuilder.Data.ElementSet
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