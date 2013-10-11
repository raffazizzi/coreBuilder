window.coreBuilder = {}

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

		  	if options.length > 0
		  		options.each ->
		  			source_id = $(@).text()
		  			sel.push source_id

		  			if !$('#ed_'+source_id).get(0)?
		  				target = $("<div class='editor' id='ed_#{source_id}'> </div>")
	  					$('#editors').append(target)

	  					editor = ace.edit(target.attr("id"))
						  editor.setTheme("ace/theme/monokai")
						  editor.getSession().setMode("ace/mode/xml")

						  url = 'data/' + source_id + '.xml'
			  			$.get(url, (data) ->
			  		    # add title
			  		    # parse data
			  		    editor.getSession().insert({column:0, row:0}, data)
			  		    console.log editor
			  		    editor.moveCursorTo({column:0, row:0})
			  		  , 'text')

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