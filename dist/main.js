sources = ["A3.xml", "Amz.xml", "C.xml", "E1-10.xml"]

sel = $("#sources select")

for (i=0; i<sources.length; i++){
  label = sources[i].slice(0, -4)
  opt = $("<option/>");   
  opt.attr("value", sources[i]);
  opt.text(label);
  sel.append(opt);
}

// Start CoreBuilder UI
new coreBuilder.App({"data_url":"data"})
