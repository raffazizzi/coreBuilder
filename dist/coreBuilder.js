(function() {
  var root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = this;

  root.coreBuilder = {};

  (function($, coreBuilder, _, Backbone, ace) {
    var Core, CoreEntry, CoreEntryView, CoreView, Selection, SelectionGroup, SelectionGroupView, SelectionView, Source, SourceView, Sources, SourcesView, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
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
    coreBuilder.Components.FileUploader = function(target) {
      return $(target).change(function(e) {
        var file, reader;
        file = e.target.files[0];
        reader = new FileReader();
        reader.onload = (function(theFile) {
          return function(e) {
            var XMLCore, entries, parser;
            parser = new DOMParser();
            XMLCore = parser.parseFromString(e.target.result, "text/xml");
            entries = $(XMLCore).find('app');
            new CoreEntryView({
              collection: coreBuilder.Data.Sources
            });
            new CoreView({
              collection: coreBuilder.Data.Core
            });
            entries.each(function(i, e) {
              var entry, string;
              string = (new XMLSerializer()).serializeToString(e);
              entry = coreBuilder.Data.Core.add({
                "entry": string,
                "formatted": string
              });
              return $(e).find('rdg').each(function(i, r) {
                var ptrs, source;
                source = entry.sources.add({
                  "source": $(r).attr("wit")
                });
                ptrs = $(r).find('ptr');
                if (ptrs.length > 0) {
                  return ptrs.each(function(i, p) {
                    return source.selectionGroup.add({
                      "xmlid": $(p).attr("target")
                    });
                  });
                } else {
                  return source.set("empty", true);
                }
              });
            });
            return $("#coreModal").modal('show');
          };
        })(file);
        return reader.readAsText(file, "UTF-8");
      });
    };
    coreBuilder.Components.SourceSelector = function(target) {
      return $(target).multiselect({
        buttonClass: 'btn',
        buttonWidth: 'auto',
        buttonContainer: '<div class="btn-group" />',
        maxHeight: false,
        onChange: function(opt, adding) {
          var s, source, url;
          source = $(opt).val();
          if (adding) {
            url = 'data/' + source + '.xml';
            source = coreBuilder.Data.Sources.add({
              source: source,
              url: url
            });
            return $.get(url, function(data) {
              var parser, xmlDoc;
              parser = new DOMParser();
              xmlDoc = parser.parseFromString(data, "text/xml");
              return source.set({
                text: data,
                xmldata: xmlDoc
              });
            }, 'text');
          } else {
            s = coreBuilder.Data.Sources.get(source);
            coreBuilder.Data.Sources.remove(source);
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
    Source = (function(_super) {
      __extends(Source, _super);

      function Source() {
        _ref = Source.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Source.prototype.idAttribute = "source";

      Source.prototype.initialize = function() {
        return this.selectionGroup = new SelectionGroup;
      };

      return Source;

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
    Selection = (function(_super) {
      __extends(Selection, _super);

      function Selection() {
        _ref2 = Selection.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Selection.prototype.idAttribute = "xmlid";

      return Selection;

    })(Backbone.Model);
    Sources = (function(_super) {
      __extends(Sources, _super);

      function Sources() {
        _ref3 = Sources.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      Sources.prototype.model = Source;

      return Sources;

    })(Backbone.Collection);
    SelectionGroup = (function(_super) {
      __extends(SelectionGroup, _super);

      function SelectionGroup() {
        _ref4 = SelectionGroup.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      SelectionGroup.prototype.model = Selection;

      return SelectionGroup;

    })(Backbone.Collection);
    Core = (function(_super) {
      __extends(Core, _super);

      function Core() {
        _ref5 = Core.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      Core.prototype.model = CoreEntry;

      return Core;

    })(Backbone.Collection);
    coreBuilder.Data.Sources = new Sources;
    coreBuilder.Data.Core = new Core;
    coreBuilder.Views = {};
    SelectionGroupView = (function(_super) {
      __extends(SelectionGroupView, _super);

      function SelectionGroupView() {
        _ref6 = SelectionGroupView.__super__.constructor.apply(this, arguments);
        return _ref6;
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
        if (m.get("empty") == null) {
          id = '#sel_' + m.id.replace(/\"/g, "");
          $(id).remove();
        }
        return this;
      };

      return SelectionGroupView;

    })(Backbone.View);
    SelectionView = (function(_super) {
      __extends(SelectionView, _super);

      function SelectionView() {
        this.removeOne = __bind(this.removeOne, this);
        _ref7 = SelectionView.__super__.constructor.apply(this, arguments);
        return _ref7;
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
        if (this.model.get("empty") == null) {
          this.$el.addClass('badge');
          id = 'sel_' + this.model.id.replace(/\"/g, "");
          this.$el.attr('id', id);
          this.$el.html(this.template(this.model.toJSON()));
        }
        return this;
      };

      return SelectionView;

    })(Backbone.View);
    SourceView = (function(_super) {
      __extends(SourceView, _super);

      function SourceView() {
        _ref8 = SourceView.__super__.constructor.apply(this, arguments);
        return _ref8;
      }

      SourceView.prototype.template = _.template($('#editor-tpl').html());

      SourceView.prototype.initialize = function() {
        this.listenTo(this.model, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      SourceView.prototype.tagName = 'div';

      SourceView.prototype.events = {
        "click .add-empty": "addEmpty"
      };

      SourceView.prototype.addEmpty = function(e) {
        var _this = this;
        this.model.selectionGroup.each(function(s) {
          return _this.model.selectionGroup.remove(s);
        });
        $(e.target).addClass("disabled");
        this.model.selectionGroup.add({
          empty: true
        });
        return this.listenTo(this.model.selectionGroup, 'remove', function(m) {
          if (m.get('empty') != null) {
            return $(e.target).removeClass("disabled");
          }
        });
      };

      SourceView.prototype.bindSelect = function() {
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
                xmlid: xmlid,
                pos: pos
              });
              return popup.remove();
            });
          }
        });
      };

      SourceView.prototype.render = function() {
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

      SourceView.prototype.remove = function() {
        $(this.el).remove();
        return this;
      };

      return SourceView;

    })(Backbone.View);
    SourcesView = (function(_super) {
      __extends(SourcesView, _super);

      function SourcesView() {
        _ref9 = SourcesView.__super__.constructor.apply(this, arguments);
        return _ref9;
      }

      SourcesView.prototype.initialize = function(collection) {
        return this.listenTo(this.collection, 'add', this.addOne);
      };

      SourcesView.prototype.addOne = function(model) {
        return new SourceView({
          model: model
        });
      };

      return SourcesView;

    })(Backbone.View);
    CoreEntryView = (function(_super) {
      __extends(CoreEntryView, _super);

      function CoreEntryView() {
        _ref10 = CoreEntryView.__super__.constructor.apply(this, arguments);
        return _ref10;
      }

      CoreEntryView.prototype.el = '#cur_entry';

      CoreEntryView.prototype.template = _.template($('#core-tpl').html());

      CoreEntryView.prototype.events = {
        "click #entry_add": "addEntry",
        "click #entry_cancel": "remove"
      };

      CoreEntryView.prototype.addEntry = function() {
        var entry, msg;
        entry = coreBuilder.Data.Core.add({
          "entry": this.toXMLString(),
          "formatted": this.toXMLString(true)
        });
        entry.sources = this.collection;
        this.remove();
        msg = $('<div class="alert alert-success fade in">Added!</div>');
        this.$el.html(msg);
        $(msg).alert();
        return window.setTimeout((function() {
          return $(msg).alert('close');
        }), 500);
      };

      CoreEntryView.prototype.toXMLString = function(format) {
        var indent, nl, p, r, xml_string, _i, _j, _len, _len1, _ref11, _ref12, _ref13, _ref14;
        if (format == null) {
          format = false;
        }
        nl = '\n';
        indent = '  ';
        xml_string = '<app>';
        _ref11 = this.collection.models;
        for (_i = 0, _len = _ref11.length; _i < _len; _i++) {
          r = _ref11[_i];
          if (((_ref12 = r.selectionGroup) != null ? _ref12.length : void 0) > 0) {
            if (format) {
              xml_string += nl + indent;
            }
            xml_string += '<rdg wit="' + r.get("source") + '>';
            _ref13 = r.selectionGroup.models;
            for (_j = 0, _len1 = _ref13.length; _j < _len1; _j++) {
              p = _ref13[_j];
              if (format) {
                xml_string += nl + indent + indent;
              }
              if (p.get("empty") != null) {
                xml_string += '<!-- empty -->';
              }
              if (((_ref14 = p.get("xmlid")) != null ? _ref14.length : void 0) > 0) {
                xml_string += '<ptr target="' + p.get("xmlid") + '/>';
              }
            }
            if (format) {
              xml_string += nl + indent;
            }
            xml_string += '</rdg>';
          }
        }
        if (format) {
          xml_string += nl;
        }
        xml_string += '</app>';
        return xml_string;
      };

      CoreEntryView.prototype.initialize = function() {
        this.listenTo(this.collection, 'add', this.addOne);
        return this;
      };

      CoreEntryView.prototype.addOne = function(model) {
        this.listenTo(model.selectionGroup, 'add', this.render);
        this.listenTo(model.selectionGroup, 'remove', this.render);
        return this;
      };

      CoreEntryView.prototype.render = function() {
        var xml_string;
        xml_string = this.toXMLString(true);
        xml_string = xml_string.replace(/</g, '&lt;');
        xml_string = xml_string.replace(/>/g, '&gt;');
        this.$el.html(this.template({
          xml_string: xml_string
        }));
        return this;
      };

      CoreEntryView.prototype.remove = function() {
        this.collection.each(function(c) {
          return c.selectionGroup.each(function(s) {
            return c.selectionGroup.remove(s);
          });
        });
        this.$el.empty();
        return this;
      };

      return CoreEntryView;

    })(Backbone.View);
    CoreView = (function(_super) {
      __extends(CoreView, _super);

      function CoreView() {
        _ref11 = CoreView.__super__.constructor.apply(this, arguments);
        return _ref11;
      }

      CoreView.prototype.initialize = function() {
        this.listenTo(this.collection, 'add', this.render);
        this.listenTo(this.collection, 'remove', this.render);
        return this;
      };

      CoreView.prototype.render = function() {
        var _this = this;
        this.$el.empty();
        this.collection.each(function(entry) {
          return _this.$el.append(new CoreEntryView({
            model: entry
          }).render());
        });
        return $("#coreModal .modal-body").html(this.$el);
      };

      return CoreView;

    })(Backbone.View);
    CoreEntryView = (function(_super) {
      __extends(CoreEntryView, _super);

      function CoreEntryView() {
        _ref12 = CoreEntryView.__super__.constructor.apply(this, arguments);
        return _ref12;
      }

      CoreEntryView.prototype.template = _.template($('#entry-tpl').html());

      CoreEntryView.prototype.tagName = 'pre';

      CoreEntryView.prototype.events = {
        "click .close": "remove"
      };

      CoreEntryView.prototype.render = function() {
        var xml_string;
        console.log(this.model);
        xml_string = this.model.get("formatted");
        xml_string = xml_string.replace(/</g, '&lt;');
        xml_string = xml_string.replace(/>/g, '&gt;');
        return this.$el.html(this.template({
          escaped_xml: xml_string
        }));
      };

      CoreEntryView.prototype.remove = function() {
        this.model.collection.remove(this.model);
        return this;
      };

      return CoreEntryView;

    })(Backbone.View);
    return coreBuilder.App = (function(_super) {
      __extends(App, _super);

      function App() {
        _ref13 = App.__super__.constructor.apply(this, arguments);
        return _ref13;
      }

      App.prototype.el = "#coreBuilder";

      App.prototype.initialize = function() {
        coreBuilder.Components.SourceSelector('.sel-sources');
        coreBuilder.Components.FileUploader('#uploadCore');
        new SourcesView({
          collection: coreBuilder.Data.Sources
        });
        new CoreEntryView({
          collection: coreBuilder.Data.Sources
        });
        new CoreView({
          collection: coreBuilder.Data.Core
        });
        return this.render();
      };

      App.prototype.render = function() {
        $('#uploadCore').popover({
          'content': 'Pick a source to start selecting elements, or upload an existing Core file.',
          'title': 'Getting Started',
          'placement': 'bottom',
          'trigger': 'manual',
          'container': '#sources'
        });
        $('#uploadCore').popover('show');
        return $('body').one("click", function() {
          return $('#uploadCore').popover('hide');
        });
      };

      return App;

    })(Backbone.View);
  })(jQuery, coreBuilder, _, Backbone, ace);

}).call(this);
