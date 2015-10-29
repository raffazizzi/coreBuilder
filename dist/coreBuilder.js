(function() {
  var root,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  root = this;

  root.coreBuilder = {};

  (function($, coreBuilder, _, Backbone, ace) {
    var Attribute, AttributeView, Attributes, AttributesView, Core, CoreEntry, CoreEntryView, Element, ElementSet, ElementSetView, FullCoreEntryView, FullCoreView, GroupingView, Selection, SelectionGroup, SelectionGroupView, SelectionView, Source, SourceView, Sources, SourcesView, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref19, _ref2, _ref20, _ref21, _ref22, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
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
            return 'Load TEI';
          }
          label = sel.join(", ");
          if (label.length > 50) {
            label = label.substring(0, 50) + "...";
          }
          return label;
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
    Attribute = (function(_super) {
      __extends(Attribute, _super);

      function Attribute() {
        _ref2 = Attribute.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Attribute.prototype.toJSON = function() {
        var atts;
        atts = _.clone(this.attributes);
        atts["id"] = this.cid;
        return atts;
      };

      return Attribute;

    })(Backbone.Model);
    Attributes = (function(_super) {
      __extends(Attributes, _super);

      function Attributes() {
        _ref3 = Attributes.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      Attributes.prototype.model = Attribute;

      return Attributes;

    })(Backbone.Collection);
    Element = (function(_super) {
      __extends(Element, _super);

      function Element() {
        _ref4 = Element.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      Element.prototype.initialize = function() {
        return this.atts = new Attributes;
      };

      return Element;

    })(Backbone.Model);
    ElementSet = (function(_super) {
      __extends(ElementSet, _super);

      function ElementSet() {
        _ref5 = ElementSet.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      ElementSet.prototype.defaults = {
        "wrapper": new Element({
          "name": "app"
        }),
        "grp": new Element({
          "name": "rdgGrp"
        }),
        "container": new Element({
          "name": "rdg"
        }),
        "ptr": new Element({
          "name": "ptr"
        })
      };

      return ElementSet;

    })(Backbone.Model);
    CoreEntry = (function(_super) {
      __extends(CoreEntry, _super);

      function CoreEntry() {
        _ref6 = CoreEntry.__super__.constructor.apply(this, arguments);
        return _ref6;
      }

      CoreEntry.prototype.initialize = function() {
        return this.sources = new Sources;
      };

      return CoreEntry;

    })(Backbone.Model);
    Selection = (function(_super) {
      __extends(Selection, _super);

      function Selection() {
        _ref7 = Selection.__super__.constructor.apply(this, arguments);
        return _ref7;
      }

      Selection.prototype.idAttribute = "xmlid";

      return Selection;

    })(Backbone.Model);
    Sources = (function(_super) {
      __extends(Sources, _super);

      function Sources() {
        _ref8 = Sources.__super__.constructor.apply(this, arguments);
        return _ref8;
      }

      Sources.prototype.model = Source;

      return Sources;

    })(Backbone.Collection);
    SelectionGroup = (function(_super) {
      __extends(SelectionGroup, _super);

      function SelectionGroup() {
        _ref9 = SelectionGroup.__super__.constructor.apply(this, arguments);
        return _ref9;
      }

      SelectionGroup.prototype.model = Selection;

      return SelectionGroup;

    })(Backbone.Collection);
    Core = (function(_super) {
      __extends(Core, _super);

      function Core() {
        _ref10 = Core.__super__.constructor.apply(this, arguments);
        return _ref10;
      }

      Core.prototype.model = CoreEntry;

      return Core;

    })(Backbone.Collection);
    coreBuilder.Data.Sources = new Sources;
    coreBuilder.Data.ElementSet = new ElementSet;
    coreBuilder.Data.Core = new Core;
    coreBuilder.Views = {};
    SelectionGroupView = (function(_super) {
      __extends(SelectionGroupView, _super);

      function SelectionGroupView() {
        _ref11 = SelectionGroupView.__super__.constructor.apply(this, arguments);
        return _ref11;
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
        _ref12 = SelectionView.__super__.constructor.apply(this, arguments);
        return _ref12;
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
        _ref13 = SourceView.__super__.constructor.apply(this, arguments);
        return _ref13;
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
          $("#el_sel_grp").remove();
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
        this.editor.setTheme("ace/theme/chrome");
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
        _ref14 = GroupingView.__super__.constructor.apply(this, arguments);
        return _ref14;
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

      GroupingView.prototype.canGroup = function() {
        var grp;
        grp = coreBuilder.Data.ElementSet.get("grp");
        if (grp == null) {
          console.log("You must set a grouping element to be able to group.");
          return false;
        } else {
          return true;
        }
      };

      GroupingView.prototype.newGroup = function(e) {
        var groups, latestGroup;
        e.preventDefault();
        e.stopPropagation();
        if (this.canGroup()) {
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
        }
      };

      GroupingView.prototype.removeFromGroup = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.canGroup()) {
          console.log("removed from group", this.model.get("group"));
          return this.model.set("group", void 0);
        }
      };

      GroupingView.prototype.addToGroup = function(e) {
        var g;
        e.preventDefault();
        e.stopPropagation();
        if (this.canGroup()) {
          g = $(e.target).data("group");
          this.model.set("group", g);
          return console.log('added to group', g);
        }
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
        _ref15 = SourcesView.__super__.constructor.apply(this, arguments);
        return _ref15;
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
        _ref16 = CoreEntryView.__super__.constructor.apply(this, arguments);
        return _ref16;
      }

      CoreEntryView.prototype.el = '#cur_entry';

      CoreEntryView.prototype.template = _.template($('#core-tpl').html());

      CoreEntryView.prototype.events = {
        "click #entry_add": "addEntry",
        "click #entry_cancel": "remove"
      };

      CoreEntryView.prototype.addEntry = function() {
        var entry, msg, r, sg, source, targets, _i, _j, _k, _len, _len1, _len2, _ref17, _ref18, _ref19;
        targets = {};
        _ref17 = this.collection.models;
        for (_i = 0, _len = _ref17.length; _i < _len; _i++) {
          r = _ref17[_i];
          source = r.get("source");
          targets[source] = [];
          _ref18 = r.selectionGroup.models;
          for (_j = 0, _len1 = _ref18.length; _j < _len1; _j++) {
            sg = _ref18[_j];
            targets[source].push(sg.get("xmlid"));
          }
        }
        entry = coreBuilder.Data.Core.add({
          "entry": this.toDOM(),
          "formatted": this.toXMLString(true),
          "output": this.toXMLString(false),
          "targets": targets
        });
        _ref19 = this.collection.models;
        for (_k = 0, _len2 = _ref19.length; _k < _len2; _k++) {
          r = _ref19[_k];
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
        var att, compiled, container_model, entry, g, grp, grpNum, grp_model, grps, isTarget, k, p, ptr, ptr_model, ptrs, r, sel, wrapper_model, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref17, _ref18, _ref19, _ref20, _ref21, _ref22, _ref23, _ref24;
        grps = {};
        wrapper_model = coreBuilder.Data.ElementSet.get("wrapper");
        grp_model = coreBuilder.Data.ElementSet.get("grp");
        container_model = coreBuilder.Data.ElementSet.get("container");
        ptr_model = coreBuilder.Data.ElementSet.get("ptr");
        entry = $("<" + wrapper_model.get("name") + ">");
        _ref17 = this.collection.models;
        for (_i = 0, _len = _ref17.length; _i < _len; _i++) {
          r = _ref17[_i];
          if (((_ref18 = r.selectionGroup) != null ? _ref18.length : void 0) > 0) {
            if (container_model != null) {
              sel = $("<" + container_model.get("name") + ">").attr({
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
              _ref19 = r.selectionGroup.models;
              for (_j = 0, _len1 = _ref19.length; _j < _len1; _j++) {
                p = _ref19[_j];
                console.log(r.selectionGroup.models);
                if (((_ref20 = p.get("xmlid")) != null ? _ref20.length : void 0) > 0) {
                  ptr = $("<" + ptr_model.get("name") + ">");
                  _ref21 = ptr_model.atts.models;
                  for (_k = 0, _len2 = _ref21.length; _k < _len2; _k++) {
                    att = _ref21[_k];
                    compiled = {};
                    isTarget = att.get("target");
                    if (isTarget) {
                      compiled[att.get("name")] = '#' + p.get("xmlid");
                      ptr.attr(compiled);
                    } else {
                      compiled[att.get("name")] = att.get("value");
                      ptr.attr(compiled);
                    }
                  }
                  sel.append(ptr);
                }
              }
            } else {
              ptrs = [];
              _ref22 = r.selectionGroup.models;
              for (_l = 0, _len3 = _ref22.length; _l < _len3; _l++) {
                p = _ref22[_l];
                if (((_ref23 = p.get("xmlid")) != null ? _ref23.length : void 0) > 0) {
                  ptr = $("<" + ptr_model.get("name") + ">").attr({
                    "target": '#' + p.get("xmlid")
                  });
                  ptrs.push(ptr);
                }
              }
              if (r.get("group")) {
                grpNum = r.get("group");
                if (grpNum in grps) {
                  grps[grpNum].concat(sel);
                } else {
                  grps[grpNum] = ptrs;
                }
              } else {
                for (_m = 0, _len4 = ptrs.length; _m < _len4; _m++) {
                  p = ptrs[_m];
                  entry.append(p);
                }
              }
            }
          }
        }
        if (grp_model != null) {
          for (k in grps) {
            grp = $("<" + grp_model.get("name") + ">");
            grp.attr("n", k);
            _ref24 = grps[k];
            for (_n = 0, _len5 = _ref24.length; _n < _len5; _n++) {
              g = _ref24[_n];
              entry.append(grp);
              grp.append(g);
            }
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
        var att, attrs, check_id, id, r, sg, source, sources, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref17, _ref18, _ref19, _ref20;
        this.$el.empty();
        sources = [];
        _ref17 = this.collection.models;
        for (_i = 0, _len = _ref17.length; _i < _len; _i++) {
          r = _ref17[_i];
          if (((_ref18 = r.selectionGroup) != null ? _ref18.length : void 0) > 0) {
            sources.push(r.get("source"));
          }
        }
        if (sources.length > 0) {
          this.$el.html(this.template({
            xml_string: this.toXMLString(true),
            sources: sources
          }));
          Prism.highlightElement(this.$el.find('code')[0]);
          _ref19 = this.collection.models;
          for (_j = 0, _len1 = _ref19.length; _j < _len1; _j++) {
            r = _ref19[_j];
            source = r.get("source");
            _ref20 = r.selectionGroup.models;
            for (_k = 0, _len2 = _ref20.length; _k < _len2; _k++) {
              sg = _ref20[_k];
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
        this.collection.each(function(c) {
          var model, _results;
          c.set("group", void 0);
          _results = [];
          while (model = c.selectionGroup.first()) {
            _results.push(c.selectionGroup.remove(model));
          }
          return _results;
        });
        this.$el.empty();
        return this;
      };

      return CoreEntryView;

    })(Backbone.View);
    FullCoreView = (function(_super) {
      __extends(FullCoreView, _super);

      function FullCoreView() {
        _ref17 = FullCoreView.__super__.constructor.apply(this, arguments);
        return _ref17;
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
        _ref18 = FullCoreEntryView.__super__.constructor.apply(this, arguments);
        return _ref18;
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
              var _i, _len, _ref19, _results1;
              _ref19 = targets[source];
              _results1 = [];
              for (_i = 0, _len = _ref19.length; _i < _len; _i++) {
                id = _ref19[_i];
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
    ElementSetView = (function(_super) {
      __extends(ElementSetView, _super);

      function ElementSetView() {
        _ref19 = ElementSetView.__super__.constructor.apply(this, arguments);
        return _ref19;
      }

      ElementSetView.prototype.el = "#el_opts";

      ElementSetView.prototype.events = {
        "click #apply_els": "apply"
      };

      ElementSetView.prototype.initialize = function() {
        var destroyViews, new_att_view,
          _this = this;
        ElementSetView.__super__.initialize.apply(this, arguments);
        this.$el.find('.preset').each(function(i, preset) {
          var $preset, container_name, grp_name, ptr_name, wrapper_name;
          $preset = $(preset);
          wrapper_name = $preset.data("wrapper");
          grp_name = $preset.data("grp");
          container_name = $preset.data("container");
          ptr_name = $preset.data("ptr");
          return $preset.click(function(e) {
            var $inp_c, $inp_g, $inp_p, $inp_w, $x, to_create, to_remove;
            e.preventDefault();
            $inp_w = $("#wrapper");
            if (wrapper_name != null) {
              $inp_w.val(wrapper_name);
              $inp_w.prop('disabled', false);
              $x = $inp_w.prev().find('a');
              $x.addClass('on');
              $x.removeClass('off');
              to_remove = {};
              to_remove["wrapper"] = null;
              _this.model.set(to_remove);
              destroyViews["wrapper"]();
              to_create = {};
              to_create["wrapper"] = new Element;
              to_create["wrapper"].set({
                "name": wrapper_name
              });
              _this.model.set(to_create);
              new_att_view("wrapper");
            } else {
              $inp_w.val("None");
              $inp_w.prop('disabled', true);
              to_remove = {};
              to_remove["wrapper"] = null;
              _this.model.set(to_remove);
              destroyViews["wrapper"]();
              $x = $inp_w.prev().find('a');
              $x.addClass('off');
              $x.removeClass('on');
            }
            $inp_g = $("#grp");
            if (grp_name != null) {
              $inp_g.val(grp_name);
              $inp_g.prop('disabled', false);
              $x = $inp_g.prev().find('a');
              $x.addClass('on');
              $x.removeClass('off');
              to_create = {};
              to_create["grp"] = new Element;
              to_create["grp"].set({
                "name": grp_name
              });
              _this.model.set(to_create);
              new_att_view("grp");
            } else {
              $inp_g.val("None");
              $inp_g.prop('disabled', true);
              to_remove = {};
              to_remove["grp"] = null;
              _this.model.set(to_remove);
              destroyViews["grp"]();
              $x = $inp_g.prev().find('a');
              $x.addClass('off');
              $x.removeClass('on');
            }
            $inp_c = $("#container");
            if (container_name != null) {
              $inp_c.val(container_name);
              $inp_c.prop('disabled', false);
              $x = $inp_c.prev().find('a');
              $x.addClass('on');
              $x.removeClass('off');
              to_create = {};
              to_create["container"] = new Element;
              to_create["container"].set({
                "name": container_name
              });
              _this.model.set(to_create);
              new_att_view("container");
            } else {
              $inp_c.val("None");
              $inp_c.prop('disabled', true);
              to_remove = {};
              to_remove["container"] = null;
              _this.model.set(to_remove);
              destroyViews["container"]();
              $x = $inp_c.prev().find('a');
              $x.addClass('off');
              $x.removeClass('on');
            }
            $inp_p = $("#ptr");
            if (ptr_name != null) {
              $inp_p.val(ptr_name);
              $inp_p.prop('disabled', false);
              $x = $inp_p.prev().find('a');
              $x.addClass('on');
              $x.removeClass('off');
              to_create = {};
              to_create["ptr"] = new Element;
              to_create["ptr"].set({
                "name": ptr_name
              });
              _this.model.set(to_create);
              new_att_view("ptr");
            } else {
              $inp_p.val("None");
              $inp_p.prop('disabled', true);
              to_remove = {};
              to_remove["ptr"] = null;
              _this.model.set(to_remove);
              destroyViews["ptr"]();
              $x = $inp_p.prev().find('a');
              $x.addClass('off');
              $x.removeClass('on');
            }
            return _this.apply();
          });
        });
        this.attViews = {};
        new_att_view = function(name) {
          if (name === "ptr") {
            _this.attViews[name] = new AttributesView({
              collection: _this.model.get(name).atts,
              el: "#att-" + name,
              defaults: {
                "atts": [],
                "target_att": "target"
              }
            });
          } else {
            _this.attViews[name] = new AttributesView({
              collection: _this.model.get(name).atts,
              el: "#att-" + name
            });
          }
          return _this.attViews[name];
        };
        new_att_view("wrapper");
        new_att_view("grp");
        new_att_view("container");
        new_att_view("ptr");
        destroyViews = {
          "wrapper": this.attViews["wrapper"].close,
          "grp": this.attViews["grp"].close,
          "container": this.attViews["container"].close,
          "ptr": this.attViews["ptr"].close
        };
        this.$el.find(".input-group").each(function(i, ig) {
          var $ig, m;
          $ig = $(ig);
          m = _this.model;
          return $ig.find('.remove').each(function(i, x) {
            var $x;
            $x = $(x);
            return $x.click(function(e) {
              var $inp, el, id, to_create, to_remove;
              e.preventDefault();
              $inp = $ig.find("input");
              id = $inp.attr("id");
              el = m.get(id);
              if ($x.hasClass('on')) {
                $inp.val("None");
                $inp.prop('disabled', true);
                $x.addClass('off');
                $x.removeClass('on');
                to_remove = {};
                to_remove[id] = null;
                m.set(to_remove);
                el.destroy();
                return destroyViews[id]();
              } else {
                $inp.val("");
                $inp.prop('disabled', false);
                $x.addClass('on');
                $x.removeClass('off');
                to_create = {};
                to_create[id] = new Element;
                m.set(to_create);
                return new_att_view(id);
              }
            });
          });
        });
        this.model.get("wrapper").set({
          "name": $("#wrapper").val()
        });
        this.model.get("grp").set({
          "name": $("#grp").val()
        });
        this.model.get("container").set({
          "name": $("#container").val()
        });
        return this.model.get("ptr").set({
          "name": $("#ptr").val()
        });
      };

      ElementSetView.prototype.apply = function() {
        var _this = this;
        return $("#apply_els").click(function(e) {
          e.preventDefault();
          coreBuilder.Data.ElementSet.get("wrapper").set({
            "name": $("#wrapper").val()
          });
          _this.attViews["wrapper"].updateCollection();
          if (coreBuilder.Data.ElementSet.get("grp") != null) {
            coreBuilder.Data.ElementSet.get("grp").set({
              "name": $("#grp").val()
            });
            _this.attViews["grp"].updateCollection();
          }
          if (coreBuilder.Data.ElementSet.get("container") != null) {
            coreBuilder.Data.ElementSet.get("container").set({
              "name": $("#container").val()
            });
            _this.attViews["container"].updateCollection();
          }
          coreBuilder.Data.ElementSet.get("ptr").set({
            "name": $("#ptr").val()
          });
          return _this.attViews["ptr"].updateCollection();
        });
      };

      return ElementSetView;

    })(Backbone.View);
    AttributesView = (function(_super) {
      __extends(AttributesView, _super);

      function AttributesView() {
        this.close = __bind(this.close, this);
        _ref20 = AttributesView.__super__.constructor.apply(this, arguments);
        return _ref20;
      }

      AttributesView.prototype.events = {
        "click .add_att": "addClick"
      };

      AttributesView.prototype.template = _.template($('#atts-tpl').html());

      AttributesView.prototype.initialize = function(options) {
        var d, _i, _len, _ref21;
        this.for_el = "for-" + this.$el.attr("id");
        this.subviews = [];
        this.render();
        if (options.defaults != null) {
          if (options.defaults.atts != null) {
            _ref21 = options.defaults.atts;
            for (_i = 0, _len = _ref21.length; _i < _len; _i++) {
              d = _ref21[_i];
              this.addOne(d, null);
            }
          }
          if (options.defaults.target_att != null) {
            return this.addOne(options.defaults.target_att, null, true);
          }
        }
      };

      AttributesView.prototype.addClick = function(e) {
        e.preventDefault();
        return this.addOne();
      };

      AttributesView.prototype.addOne = function(name, value, target) {
        var att;
        if (name == null) {
          name = "";
        }
        if (value == null) {
          value = "";
        }
        if (target == null) {
          target = false;
        }
        att = this.collection.add({
          "name": name,
          "value": null,
          "target": target
        });
        return this.renderOne(att);
      };

      AttributesView.prototype.renderOne = function(att) {
        var app_view;
        app_view = new AttributeView({
          model: att,
          el: $("#" + this.for_el)
        });
        this.subviews.push(app_view);
        return app_view.render();
      };

      AttributesView.prototype.render = function() {
        return this.$el.html(this.template({
          "name": this.for_el
        }));
      };

      AttributesView.prototype.updateCollection = function() {
        var app_view, _i, _len, _ref21, _results;
        _ref21 = this.subviews;
        _results = [];
        for (_i = 0, _len = _ref21.length; _i < _len; _i++) {
          app_view = _ref21[_i];
          _results.push(app_view.updateModel());
        }
        return _results;
      };

      AttributesView.prototype.close = function() {
        var app_view, _i, _len, _ref21;
        _ref21 = this.subviews;
        for (_i = 0, _len = _ref21.length; _i < _len; _i++) {
          app_view = _ref21[_i];
          app_view.close();
        }
        this.$el.empty();
        return this.unbind();
      };

      return AttributesView;

    })(Backbone.View);
    AttributeView = (function(_super) {
      __extends(AttributeView, _super);

      function AttributeView() {
        this.updateModel = __bind(this.updateModel, this);
        _ref21 = AttributeView.__super__.constructor.apply(this, arguments);
        return _ref21;
      }

      AttributeView.prototype.template = _.template($('#att-tpl').html());

      AttributeView.prototype.close = function() {
        this.att_el.remove();
        this.unbind();
        return this.model.destroy();
      };

      AttributeView.prototype.updateModel = function() {
        return this.model.set({
          "name": this.att_el.find('.app_name').val(),
          "value": this.att_el.find('.app_value').val()
        });
      };

      AttributeView.prototype.render = function() {
        var att,
          _this = this;
        att = this.model.toJSON();
        att["id"] = this.model.cid;
        this.att_el = $(this.template(att));
        this.att_el.find('.rem_att').click(function(e) {
          e.preventDefault();
          return _this.close();
        });
        return this.$el.append(this.att_el);
      };

      return AttributeView;

    })(Backbone.View);
    return coreBuilder.App = (function(_super) {
      __extends(App, _super);

      function App() {
        _ref22 = App.__super__.constructor.apply(this, arguments);
        return _ref22;
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
        new ElementSetView({
          model: coreBuilder.Data.ElementSet
        });
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
