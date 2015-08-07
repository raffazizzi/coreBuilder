(function() {
  var root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  root = this;

  root.coreBuilder = {};

  (function($, coreBuilder, _, Backbone, ace) {
    var Core, CoreEntry, CoreEntryView, FullCoreEntryView, FullCoreView, GroupingView, Selection, SelectionGroup, SelectionGroupView, SelectionView, Source, SourceView, Sources, SourcesView, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
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
            entries.each(function(i, e) {
              var entry, string, targets;
              string = (new XMLSerializer()).serializeToString(e);
              entry = coreBuilder.Data.Core.add({
                "entry": e,
                "output": string,
                "formatted": string.replace(/</g, "&lt;").replace(/>/g, "&gt;")
              });
              targets = {};
              return $(e).find('rdg').each(function(i, r) {
                var ptrs, source, src;
                src = $(r).attr("wit").substring(1);
                source = entry.sources.add({
                  "source": src
                });
                targets[src] = [];
                ptrs = $(r).find('ptr');
                if (ptrs.length > 0) {
                  ptrs.each(function(i, p) {
                    var trgt;
                    trgt = $(p).attr("target").substring(1);
                    source.selectionGroup.add({
                      "xmlid": trgt
                    });
                    return targets[src].push(trgt);
                  });
                } else {
                  source.set("empty", true);
                }
                entry.set({
                  targets: targets
                });
                return entry.trigger('sync');
              });
            });
            return $('#tabs a[href="#full"]').tab('show');
          };
        })(file);
        return reader.readAsText(file, "UTF-8");
      });
    };
    coreBuilder.Components.SourceSelector = function(target, data_url) {
      return $(target).multiselect({
        buttonClass: 'btn',
        buttonWidth: 'auto',
        buttonContainer: '<div class="btn-group" />',
        maxHeight: 250,
        onChange: function(opt, adding) {
          var escaped_src, s, source, url;
          source = $(opt).val();
          escaped_src = source.replace(/[\?=\.]/g, '_');
          if (adding) {
            url = data_url + '/' + source;
            source = coreBuilder.Data.Sources.add({
              source: escaped_src,
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
            s = coreBuilder.Data.Sources.get(escaped_src);
            coreBuilder.Data.Sources.remove(escaped_src);
            s.trigger('destroy');
            return s = null;
          }
        },
        buttonText: function(options) {
          var label, sel;
          sel = [];
          if (options.length > 0) {
            options.each(function() {
              var source_id;
              source_id = $(this).text();
              return sel.push(source_id);
            });
          }
          if (sel.length === 0) {
            return 'Load TEI <b class="caret"></b>';
          }
          label = sel.join(", ");
          if (label.length > 50) {
            label = label.substring(0, 50) + "...";
          }
          return label + ' <b class="caret"></b>';
        }
      });
    };
    coreBuilder.Components.CoreTabs = function(target) {
      return $(target).click(function(e) {
        e.preventDefault();
        return $(this).tab('show');
      });
    };
    coreBuilder.Routers = {};
    coreBuilder.Routers.GoToEditor = (function(_super) {
      __extends(GoToEditor, _super);

      function GoToEditor() {
        _ref = GoToEditor.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GoToEditor.prototype.routes = {
        "show/:source": "show",
        "show/:source/:id": "show"
      };

      GoToEditor.prototype.show = function(s, i) {
        var ed, fixeds, move, sel, _i, _len, _ref1;
        move = function() {
          var adjustment, editor, offset, punct;
          adjustment = 115;
          editor = ace.edit('ed_' + s);
          editor.moveCursorTo(1, 1);
          punct = "[\"']";
          editor.find(punct + i + punct, {
            regExp: true
          }, true);
          offset = $("#ed_" + s).offset().top - adjustment;
          return $('html, body').animate({
            scrollTop: offset
          }, 800);
        };
        ed = $("#ed_" + s);
        if (ed.get(0) == null) {
          fixeds = s.replace('_xml', '.xml');
          fixeds = fixeds.replace('_id_', '?id=');
          _ref1 = $('.sel-sources option');
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            sel = _ref1[_i];
            if ($(sel).val() === fixeds) {
              $('.sel-sources').multiselect('select', fixeds);
              setTimeout(move, 100);
            }
          }
        } else {
          move();
        }
        return this.navigate('#');
      };

      return GoToEditor;

    })(Backbone.Router);
    coreBuilder.Data = {};
    Source = (function(_super) {
      __extends(Source, _super);

      function Source() {
        _ref1 = Source.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Source.prototype.idAttribute = "source";

      Source.prototype.defaults = {
        "group": void 0
      };

      Source.prototype.initialize = function() {
        return this.selectionGroup = new SelectionGroup;
      };

      return Source;

    })(Backbone.Model);
    CoreEntry = (function(_super) {
      __extends(CoreEntry, _super);

      function CoreEntry() {
        _ref2 = CoreEntry.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CoreEntry.prototype.initialize = function() {
        return this.sources = new Sources;
      };

      return CoreEntry;

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
    Sources = (function(_super) {
      __extends(Sources, _super);

      function Sources() {
        _ref4 = Sources.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      Sources.prototype.model = Source;

      return Sources;

    })(Backbone.Collection);
    SelectionGroup = (function(_super) {
      __extends(SelectionGroup, _super);

      function SelectionGroup() {
        _ref5 = SelectionGroup.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      SelectionGroup.prototype.model = Selection;

      return SelectionGroup;

    })(Backbone.Collection);
    Core = (function(_super) {
      __extends(Core, _super);

      function Core() {
        _ref6 = Core.__super__.constructor.apply(this, arguments);
        return _ref6;
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
        _ref7 = SelectionGroupView.__super__.constructor.apply(this, arguments);
        return _ref7;
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
        this.render = __bind(this.render, this);
        this.removeOne = __bind(this.removeOne, this);
        _ref8 = SelectionView.__super__.constructor.apply(this, arguments);
        return _ref8;
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
        _ref9 = SourceView.__super__.constructor.apply(this, arguments);
        return _ref9;
      }

      SourceView.prototype.template = _.template($('#editor-tpl').html());

      SourceView.prototype.initialize = function() {
        this.listenToOnce(this.model, 'change', this.render);
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
              case !(token.type === "entity.other.attribute-name.xml" && token.value === 'xml:id'):
                xmlid = tokenRow[token.index + 2].value.replace;
                xmlid = xmlid.replace(/['"]/g, "");
                break;
              case !(token.type === "string.attribute-value.xml" && tokenRow[token.index - 2].value === 'xml:id'):
                xmlid = token.value;
                xmlid = xmlid.replace(/["']/g, "");
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
        this.$el.html(this.template(this.model.toJSON()));
        $("#editors").append(this.$el);
        this.editor = ace.edit("ed_" + this.model.get("source"));
        this.editor.setReadOnly(true);
        this.editor.setTheme("ace/theme/github");
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
        this.$el.append(new SelectionGroupView({
          collection: this.model.selectionGroup
        }).el);
        return (new GroupingView({
          model: this.model,
          el: this.$el.find('.groupingView')
        })).render();
      };

      SourceView.prototype.remove = function() {
        this.editor.destroy();
        $(this.el).empty().remove();
        return this;
      };

      return SourceView;

    })(Backbone.View);
    GroupingView = (function(_super) {
      __extends(GroupingView, _super);

      function GroupingView() {
        _ref10 = GroupingView.__super__.constructor.apply(this, arguments);
        return _ref10;
      }

      GroupingView.prototype.template = _.template($('#grouping-tpl').html());

      GroupingView.prototype.events = {
        "click .add-empty": "addEmpty",
        "click .newGroup": "newGroup",
        "click .removeFromGroup": "removeFromGroup",
        "click ._group": "addToGroup"
      };

      GroupingView.prototype.initialize = function() {
        var _this = this;
        return this.listenTo(this.model.collection, "change", function() {
          return _this.render();
        });
      };

      GroupingView.prototype.newGroup = function(e) {
        var groups, latestGroup;
        e.preventDefault();
        e.stopPropagation();
        groups = [];
        this.model.collection.each(function(sel) {
          var g;
          g = sel.get("group");
          if (g != null) {
            return groups.push(g);
          }
        });
        if (groups.length === 0) {
          groups = [0];
        }
        latestGroup = Math.max.apply(this, groups);
        this.model.set("group", latestGroup + 1);
        console.log("added to new group", latestGroup + 1);
        return this.model.collection.trigger("coll:change");
      };

      GroupingView.prototype.removeFromGroup = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("removed from group", this.model.get("group"));
        return this.model.set("group", void 0);
      };

      GroupingView.prototype.addToGroup = function(e) {
        var g;
        e.preventDefault();
        e.stopPropagation();
        g = $(e.target).data("group");
        this.model.set("group", g);
        return console.log('added to group', g);
      };

      GroupingView.prototype.render = function() {
        var adjustedModel, groups;
        groups = [];
        this.model.collection.each(function(sel) {
          var g;
          g = sel.get("group");
          if ((g != null) && __indexOf.call(groups, g) < 0) {
            return groups.push(g);
          }
        });
        adjustedModel = this.model.toJSON();
        adjustedModel["groups"] = groups;
        adjustedModel["start"] = this.model.get("group") != null ? false : true;
        adjustedModel["remove"] = !adjustedModel.start;
        return this.$el.html(this.template(adjustedModel));
      };

      return GroupingView;

    })(Backbone.View);
    SourcesView = (function(_super) {
      __extends(SourcesView, _super);

      function SourcesView() {
        _ref11 = SourcesView.__super__.constructor.apply(this, arguments);
        return _ref11;
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
        _ref12 = CoreEntryView.__super__.constructor.apply(this, arguments);
        return _ref12;
      }

      CoreEntryView.prototype.el = '#cur_entry';

      CoreEntryView.prototype.template = _.template($('#core-tpl').html());

      CoreEntryView.prototype.events = {
        "click #entry_add": "addEntry",
        "click #entry_cancel": "remove"
      };

      CoreEntryView.prototype.addEntry = function() {
        var entry, msg, r, sg, source, targets, _i, _j, _k, _len, _len1, _len2, _ref13, _ref14, _ref15;
        targets = {};
        _ref13 = this.collection.models;
        for (_i = 0, _len = _ref13.length; _i < _len; _i++) {
          r = _ref13[_i];
          source = r.get("source");
          targets[source] = [];
          _ref14 = r.selectionGroup.models;
          for (_j = 0, _len1 = _ref14.length; _j < _len1; _j++) {
            sg = _ref14[_j];
            targets[source].push(sg.get("xmlid"));
          }
        }
        entry = coreBuilder.Data.Core.add({
          "entry": this.toDOM(),
          "formatted": this.toXMLString(true),
          "output": this.toXMLString(false),
          "targets": targets
        });
        _ref15 = this.collection.models;
        for (_k = 0, _len2 = _ref15.length; _k < _len2; _k++) {
          r = _ref15[_k];
          r.set("group", void 0);
        }
        entry.sources = this.collection;
        entry.trigger('sync');
        this.remove();
        msg = $('<div class="alert alert-success fade in">Added!</div>');
        this.$el.html(msg);
        $(msg).alert();
        return window.setTimeout((function() {
          return $(msg).alert('close');
        }), 500);
      };

      CoreEntryView.prototype.toDOM = function() {
        var entry, g, grp, grpNum, grps, k, p, ptr, r, sel, _i, _j, _k, _len, _len1, _len2, _ref13, _ref14, _ref15, _ref16, _ref17;
        grps = {};
        entry = $("<app>");
        _ref13 = this.collection.models;
        for (_i = 0, _len = _ref13.length; _i < _len; _i++) {
          r = _ref13[_i];
          if (((_ref14 = r.selectionGroup) != null ? _ref14.length : void 0) > 0) {
            sel = $("<rdg>").attr({
              "wit": '#' + r.get("source")
            });
            if (r.get("group")) {
              grpNum = r.get("group");
              if (grpNum in grps) {
                grps[grpNum].push(sel);
              } else {
                grps[grpNum] = [sel];
              }
            } else {
              entry.append(sel);
            }
            _ref15 = r.selectionGroup.models;
            for (_j = 0, _len1 = _ref15.length; _j < _len1; _j++) {
              p = _ref15[_j];
              if (((_ref16 = p.get("xmlid")) != null ? _ref16.length : void 0) > 0) {
                ptr = $("<ptr>").attr({
                  "target": '#' + p.get("xmlid")
                });
                sel.append(ptr);
              }
            }
          }
        }
        for (k in grps) {
          grp = $("<rdgGrp>");
          grp.attr("n", k);
          _ref17 = grps[k];
          for (_k = 0, _len2 = _ref17.length; _k < _len2; _k++) {
            g = _ref17[_k];
            entry.append(grp);
            grp.append(g);
          }
        }
        return entry;
      };

      CoreEntryView.prototype.toXMLString = function(escape) {
        var xml_string;
        xml_string = vkbeautify.xml(this.toDOM().wrap('<s>').parent().html());
        if (escape) {
          xml_string = xml_string.replace(/</g, '&lt;');
          xml_string = xml_string.replace(/>/g, '&gt;');
        }
        return xml_string;
      };

      CoreEntryView.prototype.initialize = function() {
        this.listenTo(this.collection, 'add', this.addOne);
        return this;
      };

      CoreEntryView.prototype.addOne = function(model) {
        this.listenTo(model.selectionGroup, 'add', this.render);
        this.listenTo(model.selectionGroup, 'remove', this.render);
        this.listenTo(model, 'change', this.render);
        return this;
      };

      CoreEntryView.prototype.render = function() {
        var att, attrs, check_id, id, r, sg, source, sources, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref13, _ref14, _ref15, _ref16;
        this.$el.empty();
        sources = [];
        _ref13 = this.collection.models;
        for (_i = 0, _len = _ref13.length; _i < _len; _i++) {
          r = _ref13[_i];
          if (((_ref14 = r.selectionGroup) != null ? _ref14.length : void 0) > 0) {
            sources.push(r.get("source"));
          }
        }
        if (sources.length > 0) {
          this.$el.html(this.template({
            xml_string: this.toXMLString(true),
            sources: sources
          }));
          Prism.highlightElement(this.$el.find('code')[0]);
          _ref15 = this.collection.models;
          for (_j = 0, _len1 = _ref15.length; _j < _len1; _j++) {
            r = _ref15[_j];
            source = r.get("source");
            _ref16 = r.selectionGroup.models;
            for (_k = 0, _len2 = _ref16.length; _k < _len2; _k++) {
              sg = _ref16[_k];
              id = sg.get("xmlid");
              check_id = (id != null ? id.slice(0, 1) : void 0) !== '#' ? '#' + id : id;
              attrs = this.$el.find('.token.attr-name');
              for (_l = 0, _len3 = attrs.length; _l < _len3; _l++) {
                att = attrs[_l];
                if ($(att).text() === 'target') {
                  target = $(att).next().contents().filter(function() {
                    return this.nodeType !== 1;
                  });
                  if (target.text() === check_id) {
                    if (source.slice(0, 1) === '#') {
                      source = source.slice(1);
                    }
                    if (id.slice(0, 1) === '#') {
                      id = id.slice(1);
                    }
                    target.wrap("<a href='#show/" + source + "/" + id + "''></a>");
                  }
                }
              }
            }
          }
        }
        return this;
      };

      CoreEntryView.prototype.remove = function() {
        console.log(this.collection);
        this.collection.each(function(c) {
          c.set("group", void 0);
          return c.selectionGroup.each(function(s) {
            return c.selectionGroup.remove(s);
          });
        });
        this.$el.empty();
        return this;
      };

      return CoreEntryView;

    })(Backbone.View);
    FullCoreView = (function(_super) {
      __extends(FullCoreView, _super);

      function FullCoreView() {
        _ref13 = FullCoreView.__super__.constructor.apply(this, arguments);
        return _ref13;
      }

      FullCoreView.prototype.initialize = function() {
        this.listenTo(this.collection, 'add', this.render);
        this.listenTo(this.collection, 'remove', this.render);
        return this;
      };

      FullCoreView.prototype.render = function() {
        var _this = this;
        this.$el.empty();
        this.collection.each(function(entry) {
          return _this.$el.append((new FullCoreEntryView({
            model: entry
          })).delegateEvents().render().el);
        });
        return this;
      };

      return FullCoreView;

    })(Backbone.View);
    FullCoreEntryView = (function(_super) {
      __extends(FullCoreEntryView, _super);

      function FullCoreEntryView() {
        _ref14 = FullCoreEntryView.__super__.constructor.apply(this, arguments);
        return _ref14;
      }

      FullCoreEntryView.prototype.template = _.template($('#entry-tpl').html());

      FullCoreEntryView.prototype.tagName = 'pre';

      FullCoreEntryView.prototype.events = {
        "click .close": "remove"
      };

      FullCoreEntryView.prototype.render = function() {
        var linkTargets, xml_string,
          _this = this;
        xml_string = this.model.get("formatted");
        xml_string = xml_string.replace(/</g, '&lt;');
        xml_string = xml_string.replace(/>/g, '&gt;');
        this.$el.html(this.template({
          escaped_xml: xml_string
        }));
        linkTargets = function() {
          var att, attrs, check_id, id, source, target, targets, _results;
          Prism.highlightElement(_this.$el.find('code')[0]);
          targets = _this.model.get("targets");
          _results = [];
          for (source in targets) {
            _results.push((function() {
              var _i, _len, _ref15, _results1;
              _ref15 = targets[source];
              _results1 = [];
              for (_i = 0, _len = _ref15.length; _i < _len; _i++) {
                id = _ref15[_i];
                check_id = (id != null ? id.slice(0, 1) : void 0) !== '#' ? '#' + id : id;
                attrs = this.$el.find('.token.attr-name');
                _results1.push((function() {
                  var _j, _len1, _results2;
                  _results2 = [];
                  for (_j = 0, _len1 = attrs.length; _j < _len1; _j++) {
                    att = attrs[_j];
                    if ($(att).text() === 'target') {
                      target = $(att).next().contents().filter(function() {
                        return this.nodeType !== 1;
                      });
                      if (target.text() === check_id) {
                        if (source.slice(0, 1) === '#') {
                          source = source.slice(1);
                        }
                        if (id.slice(0, 1) === '#') {
                          id = id.slice(1);
                        }
                        _results2.push(target.wrap("<a href='#show/" + source + "/" + id + "''></a>"));
                      } else {
                        _results2.push(void 0);
                      }
                    } else {
                      _results2.push(void 0);
                    }
                  }
                  return _results2;
                })());
              }
              return _results1;
            }).call(_this));
          }
          return _results;
        };
        if (this.model.sources.length > 0) {
          linkTargets();
        } else {
          this.listenToOnce(this.model, 'sync', function() {
            return linkTargets();
          });
        }
        return this;
      };

      FullCoreEntryView.prototype.remove = function() {
        this.model.collection.remove(this.model);
        return this;
      };

      return FullCoreEntryView;

    })(Backbone.View);
    return coreBuilder.App = (function(_super) {
      __extends(App, _super);

      function App() {
        _ref15 = App.__super__.constructor.apply(this, arguments);
        return _ref15;
      }

      App.prototype.el = "#coreBuilder";

      App.prototype.events = {
        "click #downloadCore": "download"
      };

      App.prototype.initialize = function(options) {
        var fcv, h;
        Backbone.history.start();
        new coreBuilder.Routers.GoToEditor;
        coreBuilder.Components.SourceSelector('.sel-sources', options["data_url"]);
        coreBuilder.Components.FileUploader('#uploadCore');
        coreBuilder.Components.CoreTabs('#tabs');
        new SourcesView({
          collection: coreBuilder.Data.Sources
        });
        new CoreEntryView({
          collection: coreBuilder.Data.Sources
        });
        fcv = new FullCoreView({
          collection: coreBuilder.Data.Core
        });
        $("#full").html(fcv.$el);
        h = $(window).height() - 120;
        $("#corexml").css("height", h + 'px');
        return this.render();
      };

      App.prototype.download = function() {
        var bb, xml;
        xml = "<core>";
        coreBuilder.Data.Core.each(function(e, i) {
          return xml += e.get("output");
        });
        xml += "</core>";
        bb = new Blob([xml], {
          "type": "text\/xml"
        });
        return saveAs(bb, 'core.xml');
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
