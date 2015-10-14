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
window.plugin.hitlist.MAX_PORTALS=60;
window.plugin.hitlist.msg = '';

window.plugin.hitlist.download = function() {
  var filename = "hitlist.csv";
  var dnldelement = document.createElement('a');
  dnldelement.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(window.plugin.hitlist.msg));
  dnldelement.setAttribute('download', filename);

  dnldelement.style.display = 'none';
  document.body.appendChild(dnldelement);

  dnldelement.click();

  document.body.removeChild(dnldelement);
}

window.plugin.hitlist.portalAdded = function(data) {
   data.portal.on('add', function() {
      window.plugin.hitlist.getInfo(this.options);
   }); 
}

window.plugin.hitlist.getInfo = function(portal) {
   var apobj = window.getPortalApGain(portal.guid);
   /* TODO Configurable which team to save into the hitlist */
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
      if (window.plugin.hitlist.portals.length > 1) {
         if (ap > window.plugin.hitlist.portals[window.plugin.hitlist.portals.length - 1].ap) {
            window.plugin.hitlist.portals.push(pd);
         }
         var sortlist;
         sortlist = window.plugin.hitlist.portals.sort(function(a,b){
            var valA = a.ap;
            var valB = b.ap;
            return valA < valB ? 1 : valA > valB ? -1 : 0;
         });
         sortlist = sortlist.splice(0,window.plugin.hitlist.MAX_PORTALS); 
         window.plugin.hitlist.portals = sortlist;
      } else {
         window.plugin.hitlist.portals.push(pd); // first value, nothing else to compare with...
      }
   }
}

window.plugin.hitlist.showlist = function() {
   var msg = "<table style='width:100%' border='1'><tr><td>Name (link)</td><td>AP Gain</td><td>Health</td><td>Portal Image</td></tr>\n";
   var csv = "Name,AP Gain,Health,Link\n";
   var cp;
   window.plugin.hitlist.portals.sort(function(a,b){
      var valA = a.ap;
      var valB = b.ap;
      return valA < valB ? 1 : valA > valB ? -1 : 0;
   });
   for(i=0; i<window.plugin.hitlist.portals.length; i++) {
      var p=window.plugin.hitlist.portals[i];
      msg = msg + "<tr>" +
            "<td><a href=\"https://www.ingress.com" + p.plink + "\">" + p.name + "</a></td>" + 
            "<td>" + p.ap + "</td>" + 
            "<td>" + p.hp + "</td>" + 
            "<td>" + "<img src=\"" + p.img + "\" width=\"25%\">" + "</td>";
      csv = csv + p.name + "," + p.ap + "," + p.hp + "," + ",\"https://www.ingress.com" + p.plink + "\"\n";
   }
   msg = msg + "</table>";
   window.plugin.hitlist.msg = csv;
   msg = '<a onclick="window.plugin.hitlist.download(); return false;">Download</a>' + msg;
   //alert(msg);
   dialog({
     html: $('<div id="portalslist">').append(msg),
     dialogClass: 'ui-dialog-portalslist',
     title: 'Hit List: ' + window.plugin.hitlist.portals.length + ' ' + (window.plugin.hitlist.portals.length == 1 ? 'portal' : 'portals'),
     id: 'hitlist',
     width: 500
   });
}

var setup = function() {
    $('#toolbox').append('<a onclick="window.plugin.hitlist.showlist(); return false;" title="[k]" accesskey="k">Hit List</a>');

   window.addHook('portalAdded', window.plugin.hitlist.portalAdded);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
