
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
          editor = coreBuilder.Data.Editors.add
            source: source
            url: url
          $.get(url, (data) ->
            parser = new DOMParser()
            xmlDoc = parser.parseFromString data,"text/xml"
            editor.set 
              text : data
              xmldata : xmlDoc
            # Get title, too and other data-related stuff
            # so that the model can be mapped to a template in the view.
          , 'text')
        else
          s = coreBuilder.Data.Editors.get source
          coreBuilder.Data.Editors.remove source
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

        return sel.join(", ") + ' <b class="caret"></b>'

  ## DATA ##

  coreBuilder.Data = {}

  # Models

  class Editor extends Backbone.Model
    idAttribute : "source"

    # Using initialize instead of defaults for nested collections
    # is recommended by the Backbone FAQs:
    # http://documentcloud.github.io/backbone/#FAQ-nested
    initialize : ->
      @selectionGroup = new SelectionGroup

  class CoreEntry extends Backbone.Model
    initialize: ->
      @sources = new Sources

  class Source extends Backbone.Model

  class Selection extends Backbone.Model
    idAttribute : "xmlid"

  # Collections

  class Editors extends Backbone.Collection
    model: Editor

  class Sources extends Backbone.Collection
    model: Source

  class SelectionGroup extends Backbone.Collection
    model: Selection

  class Core extends Backbone.Collection
    model: CoreEntry

  # Expose Collections
  coreBuilder.Data.Editors = new Editors

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
      @$el.addClass 'badge'
      id = 'sel_' + @model.id.replace(/\"/g, "")
      @$el.attr 'id', id
      @$el.html @template(@model.toJSON())
      @

  class EditorView extends Backbone.View

    template: _.template $('#editor-tpl').html()

    initialize: ->
      @listenTo @model, 'change', @render
      @listenTo @model, 'destroy', @remove

    tagName: 'div'

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
              xmlid = tokenRow[token.index+2].value
            when token.type == "string" and tokenRow[token.index-2].value == 'xml:id'
              # check this is an xml:id attribute vaule (two tokens back)
              xmlid = token.value

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


  class EditorsView extends Backbone.View

    initialize: (collection) ->
      @listenTo @collection, 'add', @addOne

    addOne: (model) ->
      new EditorView model: model


  # class CoreEntryView extends Backbone.View

  #   template: _.template $('#coreEntry-tpl').html()

  #   initialize: ->
  #     @listenTo @model.selectionGroup, 'add', @render
  #     @listenTo @model.selectionGroup, 'remove', @render

  #   render: (s) ->
  #     obj = 
  #       "source" : @model.toJSON()
  #       "selectionGroup" : @model.selectionGroup
  #     @template(obj)
      

  class CoreView extends Backbone.View

    el: '#cur_entry'

    template: _.template $('#core-tpl').html()

    initialize: ->
      @listenTo @collection, 'add', @addOne
      @

    addOne: (model) ->
      @listenTo model.selectionGroup, 'add', @render
      @listenTo model.selectionGroup, 'remove', @render
      @render()
      @

    render: ->
      @$el.html @template(col : @collection)
      @

  class coreBuilder.App extends Backbone.View

    el: "#coreBuilder"

    events: 
      'click #makeNew': 'makeNewEntry'
      'click #cancelMake': 'cancelMake'

    initialize: ->
      # Bind UI components
      coreBuilder.Components.SourceSelector '.sel-sources'
      # Start Editors View
      new EditorsView collection: coreBuilder.Data.Editors
      # Start Core View on the same data
      new CoreView collection: coreBuilder.Data.Editors

      # new CoreView collection: coreBuilder.Data.Core
      # Start first entry
      coreBuilder.Data.Core.add
        first : true

    makeNewEntry: (e) ->
      btn = $(e.target)
      btn.prop 'disabled', true
      cancel = btn.next('button').removeClass("hide")

    cancelMake: (e) ->
      cancel = $(e.target)
      btn = cancel.prev('button').prop 'disabled', false
      cancel.addClass("hide")

  # class coreBuilder.coreView extends Backbone.View
  #   template: _.template($('#core-tpl').html())
  #   initialize: ->
  #     @listenTo @model, 'change', @render
  #     @listenTo @model, 'destroy', @remove
  
  #   render: ->
  #     @$el.html @template(@model.toJSON())
  #     sh_highlightDocument()
  #     @bindRemove(this.model)
  #     @
  
  #   bindRemove: (model) ->
  #     $('.remove').click ->
  #       idx = /_(\d+)/.exec($(this).attr('id'))[1]
  #       app = model.toJSON().app
  #       model.set(app.splice(0, idx).concat(app.splice(idx, app.length)))

  # class coreBuilder.appView extends Backbone.View
  #   template: _.template($('#app-tpl').html())
  #   initialize: ->
  #   render: ->
  #     @$el.html(this.template({}))
  #     @collection.each @addOne, @
  #     @
    
  #   addOne: (model) ->
  #     view = new coreBuilder.selectionView {model: model}
  #     $('#cur_grp').show().append(view.render().$el)
  #     $('#save').show()
  #     $('#makeNew').hide()
    
  #   updateCore: ->
  #     col = $.grep @collection.toJSON(), (e,i) ->
  #       e.source? and e.source != ""

  #     rgroup = 
  #       rdg:[]
  #       id: coreBuilder.Utils.generateUid()

  #     for c in col
  #       rgroup.rdg.push
  #         source:c.source
  #         ptr: c.elements

  #     core.attributes.app.push rgroup
      
  #     # REVISE
  #     # m = null
  #     # m.destroy() while m = @collection.first()

  # class coreBuilder.selectionView extends Backbone.View
  #   template: _.template($('#sel-tpl').html())
  #   initialize: ->
  #     @listenTo @model, 'change', @render
  #     @listenTo @model, 'destroy', @remove
  #   render: ->
  #     @$el.html( @template(@model.toJSON()) )
  #     @

)(jQuery,coreBuilder,_,Backbone,ace)