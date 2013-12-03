
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
          editor = coreBuilder.Data.editors.add
            source: source
            url: url
          $.get(url, (data) ->
            editor.set data : data
            # Get title, too and other data-related stuff
            # so that the model can be mapped to a template in the view.
          , 'text')
        else
          s = coreBuilder.Data.editors.get source
          coreBuilder.Data.editors.remove source
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

  # class Core extends Backbone.Model
  #   defaults:
  #     "app": []

  class Selection extends Backbone.Model
    defaults: 
      "file": ""
      "elements": []

  # Collections

  class Editors extends Backbone.Collection
    model: Editor

  class SelectionGroup extends Backbone.Collection
    model: Selection

  # Expose Collections
  coreBuilder.Data.selectionGroup = new SelectionGroup
  coreBuilder.Data.editors = new Editors

  ## VIEWS ##

  coreBuilder.Views = {}

  class EditorView extends Backbone.View
    initialize: ->
      @listenTo @model, 'change', @render
      @listenTo @model, 'destroy', @remove

    tagName: 'div'

    bindSelect: ->

      findParent = (row, column) =>
        openTags = []
        closedTags = []
        allTags = []
        isOpeningTag = false
        isClosingTag = false

        finalTag = ''
        maxRow = @editor.getSession().getLength()

        scanRow = (row, column) =>
          return if row > maxRow
          curColumn = 0
          tokens = @editor.getSession().getTokens(row)
          lastTag = null
          for token in tokens
            curColumn += token.value.length

            isfinal = ->
              switch
                when openTags.length == 0
                  true
                when openTags.length == closedTags.length
                  openTags.pop()
                  closedTags.pop()
                  false
                when openTags[openTags.length-1] == closedTags[closedTags.length-1]
                  openTags.pop()
                  closedTags.pop()
                  false
                else
                  false

            latestTag = token.value if token.type == "meta.tag.tag-name"

            if curColumn > column
              switch
                when token.type == "meta.tag" and token.value == "<"
                  isOpeningTag = true
                when token.type == "meta.tag.r" and token.value == ">" and (isOpeningTag or isClosingTag)
                  isOpeningTag = false
                  isClosingTag = false
                when token.type == "meta.tag.r" and token.value == ">" and openTags.length == 0
                  # The cursor must be on a closing tag, 
                  # return element value
                  return latestTag+"2"
                when token.type == "meta.tag" and token.value == "</"
                  isClosingTag = true
                when token.type == "meta.tag.r" and token.value == "/>"
                  isOpeningTag = false
                  isClosingTag = false
                  milestone = openTags[openTags.length-1]
                  milestone = latestTag if !milestone?
                  closedTags.push milestone
                  return milestone+"4" if isfinal()
                when token.type == "meta.tag.tag-name" and isOpeningTag
                  allTags.push "<#{token.value}>"
                  openTags.push token.value
                  return token.value+"5" if isfinal()
                when token.type == "meta.tag.tag-name" and isClosingTag
                  allTags.push "</#{token.value}>"
                  closedTags.push token.value
                  return token.value+"6" if isfinal()

          scanRow(row+1, 0)

        scanRow(row, column)

      $(@el).click =>
        pos = @editor.getCursorPosition()
        ident = findParent pos.row, pos.column

    render: ->
      console.log 'rendering'
      $el = $(@el)

      # Might replace with template
      $el.attr "id", @model.get "source"
      $el.addClass "editor"

      # Need to append the element to the DOM here
      # so that ace can be initialized.

      $("#editors").append $el

      @editor = ace.edit @model.get "source"
      @editor.setReadOnly(true)
      @editor.setTheme("ace/theme/monokai")
      @editor.getSession().setMode("ace/mode/xml")
      @editor.getSession().insert({column:0, row:0}, @model.get "data")          
      @editor.moveCursorTo({column:0, row:0})

      @bindSelect()

      @

    remove: ->
      $(@el).remove()
      @


  class coreBuilder.Views.editors extends Backbone.View

    initialize: (collection) ->
      @listenTo coreBuilder.Data.editors, 'add', @addOne

    addOne: (model) ->
      view = new EditorView model: model


  class coreBuilder.App extends Backbone.View

    el: "#coreBuilder"

    events: 
      'click #makeNew': 'makeNewEntry'
      'click #cancelMake': 'cancelMake'

    initialize: ->
      # Bind UI components
      coreBuilder.Components.SourceSelector '.sel-sources'
      # Start Editors View
      editors = new coreBuilder.Views.editors

    makeNewEntry: (e) ->
      btn = $(e.target)
      btn.prop 'disabled', true
      cancel = btn.next('button').removeClass("hide")

    cancelMake: (e) ->
      cancel = $(e.target)
      btn = cancel.prev('button').prop 'disabled', false
      cancel.addClass("hide")

  class coreBuilder.coreView extends Backbone.View
    template: _.template($('#core-tpl').html())
    initialize: ->
      @listenTo @model, 'change', @render
      @listenTo @model, 'destroy', @remove
  
    render: ->
      @$el.html @template(@model.toJSON())
      sh_highlightDocument()
      @bindRemove(this.model)
      @
  
    bindRemove: (model) ->
      $('.remove').click ->
        idx = /_(\d+)/.exec($(this).attr('id'))[1]
        app = model.toJSON().app
        model.set(app.splice(0, idx).concat(app.splice(idx, app.length)))

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