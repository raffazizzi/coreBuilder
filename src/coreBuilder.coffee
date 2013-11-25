
root = this

root.coreBuilder = {}

(($,coreBuilder,_,Backbone,ace) -> 

  ## Global

  coreBuilder.sources = []

  ## Utils

  coreBuilder.Utils = {}

  coreBuilder.Utils.generateUid = (separator) ->

    delim = if separator? then separator else "-"

    S4 = () ->
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

    return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());

  ## MODELS ##

  class coreBuilder.core extends Backbone.Model
    defaults:
      "app": []

  class coreBuilder.selection extends Backbone.Model
    defaults: 
      "source": ""
      "elements": []


  ## UI components

  coreBuilder.Components = {}

  coreBuilder.Components.multiselect = (target) ->

    $(target).multiselect
      buttonClass: 'btn'
      buttonWidth: 'auto'
      buttonContainer: '<div class="btn-group" />'
      maxHeight: false
      buttonText: (options) ->

        sel = []

        cur_sources = coreBuilder.sources

        if options.length > 0
          coreBuilder.sources = []
          options.each ->
            source_id = $(@).text()
            coreBuilder.sources.push source_id
            sel.push source_id

            if !$('#ed_'+source_id).get(0)?
              target = $("<div class='editor' id='ed_#{source_id}'> </div>")
              $('#editors').append(target)

              editor = ace.edit(target.attr("id"))
              editor.setReadOnly true
              editor.setTheme("ace/theme/monokai")
              editor.getSession().setMode("ace/mode/xml")

              _findParent = (row, column) ->
                openTags = []
                closedTags = []
                allTags = []
                isOpeningTag = false
                isClosingTag = false

                finalTag = ''
                maxRow = editor.getSession().getLength()

                _scanRow = (row, column) ->
                  return if row > maxRow
                  curColumn = 0
                  tokens = editor.getSession().getTokens(row)
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
                        when token.type == "meta.tag" and token.value == "</"
                          isClosingTag = true
                        when token.type == "meta.tag.r" and token.value == "/>"
                          isOpeningTag = false
                          isClosingTag = false
                          milestone = openTags[openTags.length-1]
                          milestone = latestTag if !milestone?
                          closedTags.push milestone
                          return milestone if isfinal()
                        when token.type == "meta.tag.tag-name" and isOpeningTag
                          allTags.push "<#{token.value}>"
                          openTags.push token.value
                          isOpeningTag = false
                          return token.value if isfinal()
                        when token.type == "meta.tag.tag-name" and isClosingTag
                          allTags.push "</#{token.value}>"
                          closedTags.push token.value
                          isClosingTag = false
                          return token.value if isfinal()

                  _scanRow(row+1, 0)
                  # switch
                  #   when closedTags.length == 0 or closedTags.length == openTags.length
                  #     _scanRow(row+1, 0)
                  #   when closedTags.length == 1 and openTags.length == 0
                  #     finalTag = closedTags[0]
                  #   else  
                  #     openTags.reverse()
                  #     for tag in openTags
                  #       pos = closedTags.lastIndexOf tag
                  #       if pos >= 0
                  #         closedTags.splice(pos)

                  #     if finalTag == "" and closedTags.length > 0
                  #       finalTag = closedTags[0]

                _scanRow(row, column)

              target.on "click", (e) ->
                pos = editor.getCursorPosition()
                ident = _findParent pos.row, pos.column
                console.log ident

              url = 'data/' + source_id + '.xml'
              $.get(url, (data) ->
                # add title
                # parse data
                editor.getSession().insert({column:0, row:0}, data)
                editor.moveCursorTo({column:0, row:0})
              , 'text')

        deleted_source = if cur_sources.length == 1 and coreBuilder.sources.length == 1 then cur_sources else cur_sources.filter (i) -> coreBuilder.sources.indexOf(i) < 0

        $('#ed_'+deleted_source[0]).remove()

        if sel.length == 0
          return 'None selected <b class="caret"></b>'
        return sel.join(", ") + ' <b class="caret"></b>'


  ## COLLECTIONS ##

  class coreBuilder.appEntry extends Backbone.Collection
    model: coreBuilder.selection
    initialize: ->

  ## VIEWS ##

  class coreBuilder.coreView extends Backbone.View.extend
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

  class coreBuilder.appView extends Backbone.View
    template: _.template($('#app-tpl').html())
    initialize: ->
    render: ->
      @$el.html(this.template({}))
      @collection.each @addOne, @
      @
    
    addOne: (model) ->
      view = new coreBuilder.selectionView {model: model}
      $('#cur_grp').show().append(view.render().$el)
      $('#save').show()
      $('#makeNew').hide()
    
    updateCore: ->
      col = $.grep @collection.toJSON(), (e,i) ->
        e.source? and e.source != ""

      rgroup = 
        rdg:[]
        id: coreBuilder.Utils.generateUid()

      for c in col
        rgroup.rdg.push
          source:c.source
          ptr: c.elements

      core.attributes.app.push rgroup
      
      # REVISE
      # m = null
      # m.destroy() while m = @collection.first()

  class coreBuilder.selectionView extends Backbone.View
    template: _.template($('#sel-tpl').html())
    initialize: ->
      @listenTo @model, 'change', @render
      @listenTo @model, 'destroy', @remove
    render: ->
      @$el.html( @template(@model.toJSON()) )
      @

)(jQuery,coreBuilder,_,Backbone,ace)