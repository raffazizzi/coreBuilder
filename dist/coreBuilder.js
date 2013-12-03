(function() {
  var root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  root = this;

  root.coreBuilder = {};

  (function($, coreBuilder, _, Backbone, ace) {
    var Editor, EditorView, Editors, Selection, SelectionGroup, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
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
              return editor.set({
                data: data
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

      return Editor;

    })(Backbone.Model);
    Selection = (function(_super) {
      __extends(Selection, _super);

      function Selection() {
        _ref1 = Selection.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Selection.prototype.defaults = {
        "file": "",
        "elements": []
      };

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
    coreBuilder.Data.selectionGroup = new SelectionGroup;
    coreBuilder.Data.editors = new Editors;
    coreBuilder.Views = {};
    EditorView = (function(_super) {
      __extends(EditorView, _super);

      function EditorView() {
        _ref4 = EditorView.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      EditorView.prototype.template = _.template($('#editor-tpl').html());

      EditorView.prototype.initialize = function() {
        this.listenTo(this.model, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      EditorView.prototype.tagName = 'div';

      EditorView.prototype.bindSelect = function() {
        var findParent,
          _this = this;
        findParent = function(row, column) {
          var allTags, closedTags, finalTag, isClosingTag, isOpeningTag, maxRow, openTags, scanRow;
          openTags = [];
          closedTags = [];
          allTags = [];
          isOpeningTag = false;
          isClosingTag = false;
          finalTag = '';
          maxRow = _this.editor.getSession().getLength();
          scanRow = function(row, column) {
            var curColumn, isfinal, lastTag, latestTag, milestone, token, tokens, _i, _len;
            if (row > maxRow) {
              return;
            }
            curColumn = 0;
            tokens = _this.editor.getSession().getTokens(row);
            lastTag = null;
            for (_i = 0, _len = tokens.length; _i < _len; _i++) {
              token = tokens[_i];
              curColumn += token.value.length;
              isfinal = function() {
                switch (false) {
                  case openTags.length !== 0:
                    return true;
                  case openTags.length !== closedTags.length:
                    openTags.pop();
                    closedTags.pop();
                    return false;
                  case openTags[openTags.length - 1] !== closedTags[closedTags.length - 1]:
                    openTags.pop();
                    closedTags.pop();
                    return false;
                  default:
                    return false;
                }
              };
              if (token.type === "meta.tag.tag-name") {
                latestTag = token.value;
              }
              if (curColumn > column) {
                switch (false) {
                  case !(token.type === "meta.tag" && token.value === "<"):
                    isOpeningTag = true;
                    break;
                  case !(token.type === "meta.tag.r" && token.value === ">" && (isOpeningTag || isClosingTag)):
                    isOpeningTag = false;
                    isClosingTag = false;
                    break;
                  case !(token.type === "meta.tag.r" && token.value === ">" && openTags.length === 0):
                    return latestTag;
                  case !(token.type === "meta.tag" && token.value === "</"):
                    isClosingTag = true;
                    break;
                  case !(token.type === "meta.tag.r" && token.value === "/>"):
                    isOpeningTag = false;
                    isClosingTag = false;
                    milestone = openTags[openTags.length - 1];
                    if (milestone == null) {
                      milestone = latestTag;
                    }
                    closedTags.push(milestone);
                    if (isfinal()) {
                      return milestone;
                    }
                    break;
                  case !(token.type === "meta.tag.tag-name" && isOpeningTag):
                    allTags.push("<" + token.value + ">");
                    openTags.push(token.value);
                    if (isfinal()) {
                      return token.value;
                    }
                    break;
                  case !(token.type === "meta.tag.tag-name" && isClosingTag):
                    allTags.push("</" + token.value + ">");
                    closedTags.push(token.value);
                    if (isfinal()) {
                      return token.value;
                    }
                }
              }
            }
            return scanRow(row + 1, 0);
          };
          return scanRow(row, column);
        };
        return $(this.el).click(function() {
          var id, ident, pos;
          pos = _this.editor.getCursorPosition();
          ident = findParent(pos.row, pos.column);
          if (ident == null) {
            ident = "none";
          }
          id = "#cur-el_" + _this.model.get("source");
          return $(id).text(" " + ident);
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
        }, this.model.get("data"));
        this.editor.moveCursorTo({
          column: 0,
          row: 0
        });
        this.bindSelect();
        return this;
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
        _ref5 = editors.__super__.constructor.apply(this, arguments);
        return _ref5;
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
        _ref6 = App.__super__.constructor.apply(this, arguments);
        return _ref6;
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
        _ref7 = coreView.__super__.constructor.apply(this, arguments);
        return _ref7;
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
