
const remote = require('remote'); 
const dialog = remote.require('dialog');
const app = remote.app;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const fs = require('fs');
const moment = require('moment');

/*
  GLOBALS, CONSTANTS, CLASSES
*/
$ = window.$;
titles = {}; // title_hash: Title

var HIGHLIGHT_TYPE = "Highlight";
var NOTE_TYPE = "Note";

function Title(title_hash, title) {
  this.title_hash = title_hash;
  this.title = title;
  this.notes = [];
}

function Note(title, type, dt, location, content) {
  this.title = title;
  this.type = type;
  this.dt = dt;
  this.location = location;
  this.content = content;
}

/* 
  HELPER FUNCTIONS
*/
hashCode = function(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function createMenu() {
  var template = [{
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
  ]}];

  if (process.platform == 'darwin') {
    var name = "Dickens";
    template.unshift({
      label: name,
      submenu: [
        {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() { app.quit(); }
        },
      ]
    });
  }

  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function refreshDiskList() {
  $("#diskList").empty();

  fs.readdir("/Volumes", function(err, files) {
    for (var i in files) {
      var fileName = files[i];
      $("#diskList").append("<option value='/Volumes/"+fileName+"'>/Volumes/"+fileName+"</option>")
    }
  });
}

function processClippings(rawClippingContent) {
  var noteSegments = rawClippingContent.split("==========");

  for (i in noteSegments) {
    var noteSegmentLines = noteSegments[i].split("\n");

    var offset = 0;
    if (noteSegmentLines[0].length == 1) {
      offset = 1;
    }

    try {
      var title = noteSegmentLines[offset + 0];
      var meta = noteSegmentLines[offset + 1];
      if (meta.indexOf("Your Bookmark") > -1) {
        continue; // don't load bookmarks
      }
      var type = NOTE_TYPE;
      if (meta.indexOf("Your Highlight") > -1) {
        type = HIGHLIGHT_TYPE;
      }
      var location = meta.slice(meta.indexOf("Location")+9, meta.indexOf("| Added")-1);
      var dt = moment(meta.split("Added on ")[1]);
      var content = noteSegmentLines.slice(offset + 2).join("<br />");

      note = new Note(title, type, dt, location, content);

      var titleHash = hashCode(title);

      if (!titles[titleHash]) {
        titles[titleHash] = new Title(titleHash, title);
      }

      titles[titleHash].notes.push(note);
    } catch(err) {
      console.log("Note parsing warning: "+err);
    } 
  }
}

function refreshTitleList() {
  $("#titles").empty();

  $.each(titles, function (title_hash, title) {
    $("#titles").append("<li><a href='#' class='list-group-item' link-title-hash='"+title_hash+"'>"+title.title+"</a></li>")
  });

  $("#titleSearch").prop("hidden", false);
  $("#titleSearch").focus();

  $("#titleSearch").hideseek({
  });
}

function loadTitle(title_hash) {
  $("#titles").prop("hidden", true);
  $("#notes").empty();
  $("#activeTitle").empty();

  var activeTitle = titles[title_hash];
  $("#activeTitle").append(activeTitle.title);  

  for (i in activeTitle.notes) {
    var note = activeTitle.notes[i];

    console.log(note);

    $("#notes").append(
      "<div class='note-item'>"+
        note.content
      +"<div class='note-meta'>"+note.type+", Location "+note.location
      +"</div></div>"
    );    
  }
}

/*
  MAIN
*/

$(document).ready(function(){
  refreshDiskList();
  createMenu();

  $("#titleSearch").prop("hidden", true);

  $("#diskListButton").on("click", function() {

    var filePath = $("#diskList").val()+"/documents/My Clippings.txt";

    fs.readFile(filePath, function(err, data) {
      if (!err) {
        var rawClippingContent = data.toString('utf8');
        processClippings(rawClippingContent);
        refreshTitleList();
      } else {
        console.log(err);
        dialog.showErrorBox(
          "Invalid Device", 
          "Clippings file could not be found or format is invalid."
        );
      }
    });
  });

  $("#titles").on("click", "li a", function(event) {
    var title_hash = $($(this)[0]).attr("link-title-hash");
    loadTitle(title_hash);
  });

  $("#refreshDiskListButton").on("click", function(event) {
    refreshDiskList();
  });

  $("#titleSearch").focusin(function() {
    $("#titles").prop("hidden", false);
  });

});
