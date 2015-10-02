// ==UserScript==
// @id             iitc-plugin-hitlist@newts
// @name           IITC plugin: hitlist
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/meyerdg/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Build portal histlist (top 10) based on AP
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

/// PLUGIN START

// use own namespace for plugin
window.plugin.hitlist = function() {};
window.plugin.hitlist.portals = []; // list of top n AP gain portals
/* TODO Make MAX_PORTALS configurable from the GUI? */
window.plugin.histlist.MAX_PORTALS=60;
window.plugin.hitlist.sortBy = 1; // second column: level
window.plugin.hitlist.sortOrder = -1;
window.plugin.hitlist.enlP = 0;
window.plugin.hitlist.resP = 0;
window.plugin.hitlist.neuP = 0;
window.plugin.hitlist.filter = 0;

window.plugin.hitlist.fields = [
  {
    title: "Portal Name",
    value: function(portal) { return portal.options.data.title; },
    sortValue: function(value, portal) { return value.toLowerCase(); },
    format: function(cell, portal, value) {
      $(cell)
        .append(plugin.portalslist.getPortalLink(portal))
        .addClass("portalTitle");
    }
  },
  {
    title: "Level",
    value: function(portal) { return portal.options.data.level; },
    format: function(cell, portal, value) {
      $(cell)
        .css('background-color', COLORS_LVL[value])
        .text('L' + value);
    },
    defaultOrder: -1,
  },
  {
    title: "Team",
    value: function(portal) { return portal.options.team; },
    format: function(cell, portal, value) {
      $(cell).text(['NEU', 'RES', 'ENL'][value]);
    }
  },
  {
    title: "Health",
    value: function(portal) { return portal.options.data.health; },
    sortValue: function(value, portal) { return portal.options.team===TEAM_NONE ? -1 : value; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .text(portal.options.team===TEAM_NONE ? '-' : value+'%');
    },
    defaultOrder: -1,
  },
  {
    title: "Res",
    value: function(portal) { return portal.options.data.resCount; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .text(value);
    },
    defaultOrder: -1,
  },
  {
    title: "Links",
    value: function(portal) { return window.getPortalLinks(portal.options.guid); },
    sortValue: function(value, portal) { return value.in.length + value.out.length; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .addClass('help')
        .attr('title', 'In:\t' + value.in.length + '\nOut:\t' + value.out.length)
        .text(value.in.length+value.out.length);
    },
    defaultOrder: -1,
  },
  {
    title: "Fields",
    value: function(portal) { return getPortalFieldsCount(portal.options.guid) },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .text(value);
    },
    defaultOrder: -1,
  },
  {
    title: "AP",
    value: function(portal) {
      return portalApGain(portal.options.guid);
    },
    sortValue: function(value, portal) { return value.enemyAp; },
    format: function(cell, portal, value) {
      var title = '';
      if (teamStringToId(PLAYER.team) == portal.options.team) {
        title += 'Friendly AP:\t'+value.friendlyAp+'\n'
               + '- deploy '+(8-portal.options.data.resCount)+' resonator(s)\n'
               + '- upgrades/mods unknown\n';
      }
      title += 'Enemy AP:\t'+value.enemyAp+'\n'
             + '- Destroy AP:\t'+value.destroyAp+'\n'
             + '- Capture AP:\t'+value.captureAp;

      $(cell)
        .addClass("alignR")
        .addClass('help')
        .prop('title', title)
        .html(digits(value.enemyAp));
    },
    defaultOrder: -1,
  },
];

window.plugin.hitlist.portalAdded = function(data) {
   data.portal.on('add', function() {
      plugin.hitlist.getInfo(this.options);
   }); 
}

window.plugin.hitlist.getInfo = function (portal) {
   var apobj = window.getPortalApGain(portal.guid);
   /* TODO Configurable which team to save into the hitlist [before any release] */
   if (apobj.enemyAp && portal.data.team == 'R') {
      var ap = apobj.enemyAp;
      var pd = {};
      pd.guid = portal.guid;
      pd.level = portal.level;
      pd.team = portal.data.team;
      pd.lat = portal.data.latE6;
      pd.lng = portal.data.lngE6;
      pd.img = portal.data.image;
      pd.res = portal.data.resCount;
      pd.name = portal.data.title;
      pd.hp = portal.data.health;
      pd.ap = ap;
      pd.lcount = window.getPortalLinksCount(portal.guid);
      pd.fcount = window.getPortalFieldsCount(portal.guid);
      pd.coord = window.findPortalLatLng(portal.guid);
      pd.plink = '/intel?ll='+pd.coord.lat+','+pd.coord.lng+'&z=17&pll='+pd.coord.lat+','+pd.coord.lng;
      console.log('HITLIST: portal info snarfed');
window.plugin.hitlist.portals = []; // list of top n AP gain portals
      if (window.plugin.hitlist.portals.length > 1) {
         if (ap > plist[plist.length - 1].ap) {
            window.plist.push(pd);
         }
         var sortlist;
         sortlist = window.plist.sort(function(a,b){
            var valA = a.ap;
            var valB = b.ap;
            return valA < valB ? 1 : valA > valB ? -1 : 0;
         });
         sortlist = sortlist.splice(0,window.HITLIST_MAX_PORTALS); 
         window.plist = sortlist;
      } else {
         window.plist.push(pd); // first value, nothing else to compare with...
      }
   }
}

window.plugin.hitlist.showlist = function() {
   console.log('HITLIST: list length ' + window.plist.length);
   //var msg = "Guid " + pd.guid + "\nLevel " + pd.level + "\nTeam " + pd.team + "\nLatLng" + pd.lat + "," + pd.lng + "\n<a href='" + pd.plink + "'>Permalink</a>";
   var msg = "guid,level,team,lat,lng,img,rescnt,name,health,apgain,linkcnt,fieldcnt,permalink\n";
   var cp;
   window.plist.sort(function(a,b){
      var valA = a.ap;
      var valB = b.ap;
      return valA < valB ? 1 : valA > valB ? -1 : 0;
   });
   for(i=0; i<window.plist.length; i++) {
      msg = msg + 
            window.plist[i].guid + "," + 
            window.plist[i].level + "," + 
            window.plist[i].team + "," + 
            window.plist[i].lat + "," + 
            window.plist[i].lng + ",'" + 
            window.plist[i].img + "'," + 
            window.plist[i].res + "," + 
            window.plist[i].name + "," + 
            window.plist[i].hp + "," + 
            window.plist[i].ap + "," + 
            window.plist[i].lcount + "," + 
            window.plist[i].fcount + ",'https://ingress.com" + 
            window.plist[i].plink + "'\n";
   }
   alert(msg);
}

var setup = function() {
   $('#toolbox').append('<a onclick="window.plugin.hitlist.showlist(); return false;" title="[k]" accesskey="k">Hit List</a>');

   window.addHook('portalAdded', window.plugin.hitlist.portalAdded);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@

/*
@@@@@@@@@@@@@@@@@@@@@ TO DO @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

      Finish integrating the stuff from portalslist into
      hitlist so that when the list displays
      it looks nice
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
*/
/*
// use own namespace for plugin
window.plugin.portalslist = function() {};


//fill the listPortals array with portals avaliable on the map (level filtered portals will not appear in the table)
window.plugin.portalslist.getPortals = function() {
  //filter : 0 = All, 1 = Neutral, 2 = Res, 3 = Enl, -x = all but x
  var retval=false;

  var displayBounds = map.getBounds();

  window.plugin.portalslist.listPortals = [];
  $.each(window.portals, function(i, portal) {
    // eliminate offscreen portals (selected, and in padding)
    if(!displayBounds.contains(portal.getLatLng())) return true;

    retval=true;

    switch (portal.options.team) {
      case TEAM_RES:
        window.plugin.portalslist.resP++;
        break;
      case TEAM_ENL:
        window.plugin.portalslist.enlP++;
        break;
      default:
        window.plugin.portalslist.neuP++;
    }

    // cache values and DOM nodes
    var obj = { portal: portal, values: [], sortValues: [] };

    var row = document.createElement('tr');
    row.className = TEAM_TO_CSS[portal.options.team];
    obj.row = row;

    var cell = row.insertCell(-1);
    cell.className = 'alignR';

    window.plugin.portalslist.fields.forEach(function(field, i) {
      cell = row.insertCell(-1);

      var value = field.value(portal);
      obj.values.push(value);

      obj.sortValues.push(field.sortValue ? field.sortValue(value, portal) : value);

      if(field.format) {
        field.format(cell, portal, value);
      } else {
        cell.textContent = value;
      }
    });

    window.plugin.portalslist.listPortals.push(obj);
  });

  return retval;
}

window.plugin.portalslist.displayPL = function() {
  var list;
  // plugins (e.g. bookmarks) can insert fields before the standard ones - so we need to search for the 'level' column
  window.plugin.portalslist.sortBy = window.plugin.portalslist.fields.map(function(f){return f.title;}).indexOf('Level');
  window.plugin.portalslist.sortOrder = -1;
  window.plugin.portalslist.enlP = 0;
  window.plugin.portalslist.resP = 0;
  window.plugin.portalslist.neuP = 0;
  window.plugin.portalslist.filter = 0;

  if (window.plugin.portalslist.getPortals()) {
    list = window.plugin.portalslist.portalTable(window.plugin.portalslist.sortBy, window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter);
  } else {
    list = $('<table class="noPortals"><tr><td>Nothing to show!</td></tr></table>');
  };

  if(window.useAndroidPanes()) {
    $('<div id="portalslist" class="mobile">').append(list).appendTo(document.body);
  } else {
    dialog({
      html: $('<div id="portalslist">').append(list),
      dialogClass: 'ui-dialog-portalslist',
      title: 'Portal list: ' + window.plugin.portalslist.listPortals.length + ' ' + (window.plugin.portalslist.listPortals.length == 1 ? 'portal' : 'portals'),
      id: 'portal-list',
      width: 700
    });
  }
}

window.plugin.portalslist.portalTable = function(sortBy, sortOrder, filter) {
  // save the sortBy/sortOrder/filter
  window.plugin.portalslist.sortBy = sortBy;
  window.plugin.portalslist.sortOrder = sortOrder;
  window.plugin.portalslist.filter = filter;

  var portals = window.plugin.portalslist.listPortals;
  var sortField = window.plugin.portalslist.fields[sortBy];

  portals.sort(function(a, b) {
    var valueA = a.sortValues[sortBy];
    var valueB = b.sortValues[sortBy];

    if(sortField.sort) {
      return sortOrder * sortField.sort(valueA, valueB, a.portal, b.portal);
    }

//FIXME: sort isn't stable, so re-sorting identical values can change the order of the list.
//fall back to something constant (e.g. portal name?, portal GUID?),
//or switch to a stable sort so order of equal items doesn't change
    return sortOrder *
      (valueA < valueB ? -1 :
      valueA > valueB ?  1 :
      0);
  });

  if(filter !== 0) {
    portals = portals.filter(function(obj) {
      return filter < 0
        ? obj.portal.options.team+1 != -filter
        : obj.portal.options.team+1 == filter;
    });
  }

  var table, row, cell;
  var container = $('<div>');

  table = document.createElement('table');
  table.className = 'filter';
  container.append(table);

  row = table.insertRow(-1);

  var length = window.plugin.portalslist.listPortals.length;

  ["All", "Neutral", "Resistance", "Enlightened"].forEach(function(label, i) {
    cell = row.appendChild(document.createElement('th'));
    cell.className = 'filter' + label.substr(0, 3);
    cell.textContent = label+':';
    cell.title = 'Show only portals of this color';
    $(cell).click(function() {
      $('#portalslist').empty().append(window.plugin.portalslist.portalTable(sortBy, sortOrder, i));
    });


    cell = row.insertCell(-1);
    cell.className = 'filter' + label.substr(0, 3);
    if(i != 0) cell.title = 'Hide portals of this color';
    $(cell).click(function() {
      $('#portalslist').empty().append(window.plugin.portalslist.portalTable(sortBy, sortOrder, -i));
    });

    switch(i-1) {
      case -1:
        cell.textContent = length;
        break;
      case 0:
        cell.textContent = window.plugin.portalslist.neuP + ' (' + Math.round(window.plugin.portalslist.neuP/length*100) + '%)';
        break;
      case 1:
        cell.textContent = window.plugin.portalslist.resP + ' (' + Math.round(window.plugin.portalslist.resP/length*100) + '%)';
        break;
      case 2:
        cell.textContent = window.plugin.portalslist.enlP + ' (' + Math.round(window.plugin.portalslist.enlP/length*100) + '%)';
    }
  });

  table = document.createElement('table');
  table.className = 'portals';
  container.append(table);

  var thead = table.appendChild(document.createElement('thead'));
  row = thead.insertRow(-1);

  cell = row.appendChild(document.createElement('th'));
  cell.textContent = '#';

  window.plugin.portalslist.fields.forEach(function(field, i) {
    cell = row.appendChild(document.createElement('th'));
    cell.textContent = field.title;
    if(field.sort !== null) {
      cell.classList.add("sortable");
      if(i == window.plugin.portalslist.sortBy) {
        cell.classList.add("sorted");
      }

      $(cell).click(function() {
        var order;
        if(i == sortBy) {
          order = -sortOrder;
        } else {
          order = field.defaultOrder < 0 ? -1 : 1;
        }

        $('#portalslist').empty().append(window.plugin.portalslist.portalTable(i, order, filter));
      });
    }
  });

  portals.forEach(function(obj, i) {
    var row = obj.row
    if(row.parentNode) row.parentNode.removeChild(row);

    row.cells[0].textContent = i+1;

    table.appendChild(row);
  });

  container.append('<div class="disclaimer">Click on portals table headers to sort by that column. '
    + 'Click on <b>All, Neutral, Resistance, Enlightened</b> to only show portals owner by that faction or on the number behind the factions to show all but those portals.</div>');

  return container;
}

// portal link - single click: select portal
//               double click: zoom to and select portal
// code from getPortalLink function by xelio from iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
window.plugin.portalslist.getPortalLink = function(portal) {
      var fields = window.getPortalFieldsCount(portal.options.guid);
  var coord = portal.getLatLng();
  var perma = '/intel?ll='+coord.lat+','+coord.lng+'&z=17&pll='+coord.lat+','+coord.lng;

  // jQuery's event handlers seem to be removed when the nodes are remove from the DOM
  var link = document.createElement("a");
  link.textContent = portal.options.data.title;
  link.href = perma;
  link.addEventListener("click", function(ev) {
    renderPortalDetails(portal.options.guid);
    ev.preventDefault();
    return false;
  }, false);
  link.addEventListener("dblclick", function(ev) {
    zoomToAndShowPortal(portal.options.guid, [coord.lat, coord.lng]);
    ev.preventDefault();
    return false;
  });
  return link;
}

window.plugin.portalslist.onPaneChanged = function(pane) {
  if(pane == "plugin-portalslist")
    window.plugin.portalslist.displayPL();
  else
    $("#portalslist").remove()
};

var setup =  function() {
  if(window.useAndroidPanes()) {
    android.addPane("plugin-portalslist", "Portals list", "ic_action_paste");
    addHook("paneChanged", window.plugin.portalslist.onPaneChanged);
  } else {
    $('#toolbox').append('<a onclick="window.plugin.portalslist.displayPL()" title="Display a list of portals in the current view [t]" accesskey="t">Portals list</a>');
  }

  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/portals-list.css@@")
    .appendTo("head");

}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
*/
