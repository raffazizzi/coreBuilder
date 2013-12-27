(function() {
  var root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = this;

  root.coreBuilder = {};

  (function($, coreBuilder, _, Backbone, ace) {
    var Core, CoreEntry, CoreView, Editor, EditorView, Editors, EditorsView, Selection, SelectionGroup, SelectionGroupView, SelectionView, Source, Sources, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
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
            editor = coreBuilder.Data.Editors.add({
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
            s = coreBuilder.Data.Editors.get(source);
            coreBuilder.Data.Editors.remove(source);
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
    CoreEntry = (function(_super) {
      __extends(CoreEntry, _super);

      function CoreEntry() {
        _ref1 = CoreEntry.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CoreEntry.prototype.initialize = function() {
        return this.sources = new Sources;
      };

      return CoreEntry;

    })(Backbone.Model);
    Source = (function(_super) {
      __extends(Source, _super);

      function Source() {
        _ref2 = Source.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      return Source;

    })(Backbone.Model);
    Selection = (function(_super) {
      __extends(Selection, _super);

      function Selection() {
        _ref3 = Selection.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      Selection.prototype.idAttribute = "xmlid";

      return Selection;

    })(Backbone.Model);
    Editors = (function(_super) {
      __extends(Editors, _super);

      function Editors() {
        _ref4 = Editors.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      Editors.prototype.model = Editor;

      return Editors;

    })(Backbone.Collection);
    Sources = (function(_super) {
      __extends(Sources, _super);

      function Sources() {
        _ref5 = Sources.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      Sources.prototype.model = Source;

      return Sources;

    })(Backbone.Collection);
    SelectionGroup = (function(_super) {
      __extends(SelectionGroup, _super);

      function SelectionGroup() {
        _ref6 = SelectionGroup.__super__.constructor.apply(this, arguments);
        return _ref6;
      }

      SelectionGroup.prototype.model = Selection;

      return SelectionGroup;

    })(Backbone.Collection);
    Core = (function(_super) {
      __extends(Core, _super);

      function Core() {
        _ref7 = Core.__super__.constructor.apply(this, arguments);
        return _ref7;
      }

      Core.prototype.model = CoreEntry;

      return Core;

    })(Backbone.Collection);
    coreBuilder.Data.Editors = new Editors;
    coreBuilder.Views = {};
    SelectionGroupView = (function(_super) {
      __extends(SelectionGroupView, _super);

      function SelectionGroupView() {
        _ref8 = SelectionGroupView.__super__.constructor.apply(this, arguments);
        return _ref8;
      }

      SelectionGroupView.prototype.initialize = function() {
        this.listenTo(this.collection, 'add', this.addOne);
        return this.listenTo(this.collection, 'remove', this.removeOne);
      };

      SelectionGroupView.prototype.addOne = function(m) {
        this.$el.append(new SelectionView({
          model: m
        }).render().el);
        return this;
      };

      SelectionGroupView.prototype.removeOne = function(m) {
        var id;
        id = '#sel_' + m.id.replace(/\"/g, "");
        $(id).remove();
        return this;
      };

      return SelectionGroupView;

    })(Backbone.View);
    SelectionView = (function(_super) {
      __extends(SelectionView, _super);

      function SelectionView() {
        this.removeOne = __bind(this.removeOne, this);
        _ref9 = SelectionView.__super__.constructor.apply(this, arguments);
        return _ref9;
      }

      SelectionView.prototype.tagName = 'span';

      SelectionView.prototype.template = _.template($('#selection-tpl').html());

      SelectionView.prototype.events = {
        'click .sel-remove': 'removeOne'
      };

      SelectionView.prototype.removeOne = function() {
        return this.model.collection.remove(this.model.id, {
          silent: false
        });
      };

      SelectionView.prototype.render = function() {
        var id;
        this.$el.addClass('badge');
        id = 'sel_' + this.model.id.replace(/\"/g, "");
        this.$el.attr('id', id);
        this.$el.html(this.template(this.model.toJSON()));
        return this;
      };

      return SelectionView;

    })(Backbone.View);
    EditorView = (function(_super) {
      __extends(EditorView, _super);

      function EditorView() {
        _ref10 = EditorView.__super__.constructor.apply(this, arguments);
        return _ref10;
      }

      EditorView.prototype.template = _.template($('#editor-tpl').html());

      EditorView.prototype.initialize = function() {
        this.listenTo(this.model, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      EditorView.prototype.tagName = 'div';

      EditorView.prototype.bindSelect = function() {
        var _this = this;
        return $(this.editor.container).click(function(e) {
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
    EditorsView = (function(_super) {
      __extends(EditorsView, _super);

      function EditorsView() {
        _ref11 = EditorsView.__super__.constructor.apply(this, arguments);
        return _ref11;
      }

      EditorsView.prototype.initialize = function(collection) {
        return this.listenTo(this.collection, 'add', this.addOne);
      };

      EditorsView.prototype.addOne = function(model) {
        return new EditorView({
          model: model
        });
      };

      return EditorsView;

    })(Backbone.View);
    CoreView = (function(_super) {
      __extends(CoreView, _super);

      function CoreView() {
        _ref12 = CoreView.__super__.constructor.apply(this, arguments);
        return _ref12;
      }

      CoreView.prototype.el = '#cur_entry';

      CoreView.prototype.template = _.template($('#core-tpl').html());

      CoreView.prototype.initialize = function() {
        this.listenTo(this.collection, 'add', this.addOne);
        return this;
      };

      CoreView.prototype.addOne = function(model) {
        this.listenTo(model.selectionGroup, 'add', this.render);
        this.listenTo(model.selectionGroup, 'remove', this.render);
        this.render();
        return this;
      };

      CoreView.prototype.render = function() {
        this.$el.html(this.template({
          col: this.collection
        }));
        return this;
      };

      return CoreView;

    })(Backbone.View);
    return coreBuilder.App = (function(_super) {
      __extends(App, _super);

      function App() {
        _ref13 = App.__super__.constructor.apply(this, arguments);
        return _ref13;
      }

      App.prototype.el = "#coreBuilder";

      App.prototype.events = {
        'click #makeNew': 'makeNewEntry',
        'click #cancelMake': 'cancelMake'
      };

      App.prototype.initialize = function() {
        coreBuilder.Components.SourceSelector('.sel-sources');
        new EditorsView({
          collection: coreBuilder.Data.Editors
        });
        new CoreView({
          collection: coreBuilder.Data.Editors
        });
        return coreBuilder.Data.Core.add({
          first: true
        });
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
  })(jQuery, coreBuilder, _, Backbone, ace);

}).call(this);
