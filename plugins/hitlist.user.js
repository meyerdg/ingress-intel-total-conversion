// ==UserScript==
// @id             iitc-plugin-hitlist@newts
// @name           IITC plugin: hitlist
// @category       Infoz
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
window.HITLIST_MAX_PORTALS=30;
//window.plugin.hitlist.portals = []; // list of top n AP gain portals
window.plist = [];

// use own namespace for plugin
window.plugin.hitlist = function() {};


window.plugin.hitlist.portalAdded = function(data) {
   data.portal.on('add', function() {
      plugin.hitlist.getInfo(this.options);
   }); 
}

window.plugin.hitlist.getInfo = function (portal) {
   var apobj = window.getPortalApGain(portal.guid);
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
   window.plist.sort(function(a,b){
      var valA = a.ap;
      var valB = b.ap;
      return valA < valB ? -1 : valA > valB ? 1 : 0;
   });
   if (window.plist.length > 1) {
      if (ap > plist[0].ap) {
         window.plist.push(pd);
      }
   } else {
      window.plist.push(pd); // first value, nothing else to compare with...
   }
   if (window.plist.length >= window.HITLIST_MAX_PORTALS) { // just add portals until it's time to truncate
		var sortlist;
      sortlist = window.plist.sort(function(a,b){
         var valA = a.ap;
         var valB = b.ap;
         return valA < valB ? -1 : valA > valB ? 1 : 0;
      });
      sortlist = sortlist.splice(0,window.HITLIST_MAX_PORTALS); 
		window.plist = sortlist;
   }
/*
   if (window.plist.length >= window.HITLIST_MAX_PORTALS) {
      window.plist = window.plist.splice(0,window.HITLIST_MAX_PORTALS); // truncate if longer than MAX_PORTALS
   }
*/
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
