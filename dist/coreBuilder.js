(function() {
  var root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  root = this;

  root.coreBuilder = {};

  (function($, coreBuilder, _, Backbone, ace) {
    var Editor, EditorView, Editors, Selection, SelectionGroup, SelectionGroupView, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    coreBuilder.Utils = {};
    coreBuilder.Utils.generateUid = function(separator) {
      var S4, delim;
      delim = separator != null ? separator : "-";
      S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      };
      return S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4();
    };
    coreBuilder.Components = {};
    coreBuilder.Components.SourceSelector = function(target) {
      return $(target).multiselect({
        buttonClass: 'btn',
        buttonWidth: 'auto',
        buttonContainer: '<div class="btn-group" />',
        maxHeight: false,
        onChange: function(opt, adding) {
          var editor, s, source, url;
          source = $(opt).val();
          if (adding) {
            url = 'data/' + source + '.xml';
            editor = coreBuilder.Data.editors.add({
              source: source,
              url: url
            });
            return $.get(url, function(data) {
              var parser, xmlDoc;
              parser = new DOMParser();
              xmlDoc = parser.parseFromString(data, "text/xml");
              return editor.set({
                text: data,
                xmldata: xmlDoc
              });
            }, 'text');
          } else {
            s = coreBuilder.Data.editors.get(source);
            coreBuilder.Data.editors.remove(source);
            return s.trigger('destroy');
          }
        },
        buttonText: function(options) {
          var sel;
          sel = [];
          if (options.length > 0) {
            options.each(function() {
              var source_id;
              source_id = $(this).text();
              return sel.push(source_id);
            });
          }
          if (sel.length === 0) {
            return 'Sources <b class="caret"></b>';
          }
          return sel.join(", ") + ' <b class="caret"></b>';
        }
      });
    };
    coreBuilder.Data = {};
    Editor = (function(_super) {
      __extends(Editor, _super);

      function Editor() {
        _ref = Editor.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Editor.prototype.idAttribute = "source";

      Editor.prototype.initialize = function() {
        return this.selectionGroup = new SelectionGroup;
      };

      return Editor;

    })(Backbone.Model);
    Selection = (function(_super) {
      __extends(Selection, _super);

      function Selection() {
        _ref1 = Selection.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Selection.prototype.idAttribute = "xmlid";

      return Selection;

    })(Backbone.Model);
    Editors = (function(_super) {
      __extends(Editors, _super);

      function Editors() {
        _ref2 = Editors.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Editors.prototype.model = Editor;

      return Editors;

    })(Backbone.Collection);
    SelectionGroup = (function(_super) {
      __extends(SelectionGroup, _super);

      function SelectionGroup() {
        _ref3 = SelectionGroup.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      SelectionGroup.prototype.model = Selection;

      return SelectionGroup;

    })(Backbone.Collection);
    coreBuilder.Data.editors = new Editors;
    coreBuilder.Views = {};
    SelectionGroupView = (function(_super) {
      __extends(SelectionGroupView, _super);

      function SelectionGroupView() {
        _ref4 = SelectionGroupView.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      SelectionGroupView.prototype.template = _.template($('#selection-tpl').html());

      SelectionGroupView.prototype.initialize = function() {
        return this.listenTo(this.collection, 'add', this.render);
      };

      SelectionGroupView.prototype.render = function() {
        this.$el.html(this.template({
          col: this.collection.toJSON()
        }));
        return this;
      };

      return SelectionGroupView;

    })(Backbone.View);
    EditorView = (function(_super) {
      __extends(EditorView, _super);

      function EditorView() {
        _ref5 = EditorView.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      EditorView.prototype.template = _.template($('#editor-tpl').html());

      EditorView.prototype.initialize = function() {
        this.listenTo(this.model, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      EditorView.prototype.tagName = 'div';

      EditorView.prototype.bindSelect = function() {
        var _this = this;
        return $(this.el).click(function(e) {
          var find_q, popup, pos, tagName, token, tokenRow, xmldata, xmlel, xmlid;
          e.stopPropagation();
          $("#el_select").remove();
          pos = _this.editor.getCursorPosition();
          token = _this.editor.session.getTokenAt(pos.row, pos.column);
          tokenRow = _this.editor.session.getTokens(pos.row);
          if (token != null) {
            switch (false) {
              case !(token.type === "entity.other.attribute-name" && token.value === 'xml:id'):
                xmlid = tokenRow[token.index + 2].value;
                break;
              case !(token.type === "string" && tokenRow[token.index - 2].value === 'xml:id'):
                xmlid = token.value;
            }
          }
          if (xmlid != null) {
            xmldata = $(_this.model.get("xmldata"));
            find_q = "*[xml\\:id=" + xmlid + "]";
            xmlel = xmldata.find(find_q);
            tagName = xmlel.prop("tagName");
            popup = $('<button type="button" class="btn btn-default" id="el_select">' + tagName + '</button>');
            popup.css({
              'position': 'absolute',
              'left': e.pageX,
              'top': e.pageY,
              'z-index': 999
            });
            $('html').append(popup);
            return popup.click(function(e) {
              e.stopPropagation();
              _this.model.selectionGroup.add({
                ident: tagName,
                xmlid: xmlid
              });
              return popup.remove();
            });
          }
        });
      };

      EditorView.prototype.render = function() {
        var $el;
        $el = $(this.el);
        $el.html(this.template(this.model.toJSON()));
        $("#editors").append($el);
        this.editor = ace.edit("ed_" + this.model.get("source"));
        this.editor.setReadOnly(true);
        this.editor.setTheme("ace/theme/monokai");
        this.editor.getSession().setMode("ace/mode/xml");
        this.editor.getSession().insert({
          column: 0,
          row: 0
        }, this.model.get("text"));
        this.editor.moveCursorTo({
          column: 0,
          row: 0
        });
        this.bindSelect();
        return $el.append(new SelectionGroupView({
          collection: this.model.selectionGroup
        }).el);
      };

      EditorView.prototype.remove = function() {
        $(this.el).remove();
        return this;
      };

      return EditorView;

    })(Backbone.View);
    coreBuilder.Views.editors = (function(_super) {
      __extends(editors, _super);

      function editors() {
        _ref6 = editors.__super__.constructor.apply(this, arguments);
        return _ref6;
      }

      editors.prototype.initialize = function(collection) {
        return this.listenTo(coreBuilder.Data.editors, 'add', this.addOne);
      };

      editors.prototype.addOne = function(model) {
        var view;
        return view = new EditorView({
          model: model
        });
      };

      return editors;

    })(Backbone.View);
    coreBuilder.App = (function(_super) {
      __extends(App, _super);

      function App() {
        _ref7 = App.__super__.constructor.apply(this, arguments);
        return _ref7;
      }

      App.prototype.el = "#coreBuilder";

      App.prototype.events = {
        'click #makeNew': 'makeNewEntry',
        'click #cancelMake': 'cancelMake'
      };

      App.prototype.initialize = function() {
        var editors;
        coreBuilder.Components.SourceSelector('.sel-sources');
        return editors = new coreBuilder.Views.editors;
      };

      App.prototype.makeNewEntry = function(e) {
        var btn, cancel;
        btn = $(e.target);
        btn.prop('disabled', true);
        return cancel = btn.next('button').removeClass("hide");
      };

      App.prototype.cancelMake = function(e) {
        var btn, cancel;
        cancel = $(e.target);
        btn = cancel.prev('button').prop('disabled', false);
        return cancel.addClass("hide");
      };

      return App;

    })(Backbone.View);
    return coreBuilder.coreView = (function(_super) {
      __extends(coreView, _super);

      function coreView() {
        _ref8 = coreView.__super__.constructor.apply(this, arguments);
        return _ref8;
      }

      coreView.prototype.template = _.template($('#core-tpl').html());

      coreView.prototype.initialize = function() {
        this.listenTo(this.model, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      coreView.prototype.render = function() {
        this.$el.html(this.template(this.model.toJSON()));
        sh_highlightDocument();
        this.bindRemove(this.model);
        return this;
      };

      coreView.prototype.bindRemove = function(model) {
        return $('.remove').click(function() {
          var app, idx;
          idx = /_(\d+)/.exec($(this).attr('id'))[1];
          app = model.toJSON().app;
          return model.set(app.splice(0, idx).concat(app.splice(idx, app.length)));
        });
      };

      return coreView;

    })(Backbone.View);
  })(jQuery, coreBuilder, _, Backbone, ace);

}).call(this);
