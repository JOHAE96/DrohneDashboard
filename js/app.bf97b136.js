(function(){"use strict";var e={3451:function(e,n,r){var t=r(5130),o=r(1387),a=(r(4603),r(7566),r(8721),r(6768)),i=r(144),u=r(6886),s=r.n(u);const l=s().icon({iconUrl:r(7024),shadowUrl:r(1071),iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]}),p={icon:l};s().canvas({padding:.5});var d=JSON.parse('[{"coorinades":[50.927487905728235,11.594333244037017],"name":"Landfeste"},{"coorinades":[50.92312263435002,11.586930178792763],"name":"Hängemattenspot"},{"coorinades":[50.88362138175022,11.583493346378646],"name":"Hängemattenspot Steinbruch"},{"coorinades":[50.91545456972983,11.639611242095874],"name":"Lagerfeuerstelle Steinkreuz"},{"coorinades":[50.961433959974904,11.596064577682904],"name":"Lagerfeuerstelle Jägerberg"},{"coorinades":[50.8930553631405,11.617492582771131],"name":"Lagerfeuerstelle unter der Lobdeburg"}]');const c=()=>{const e=s().map("map",{preferCanvas:!1}).setView([50.927487905728235,11.594333244037017],25);return s().tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(e),d.forEach((n=>{b(e,n.coorinades,n.name)})),e},b=(e,n,r)=>{s().marker(n,p).addTo(e).bindPopup(r)},f={id:"map"};var h={__name:"DrohneMap",props:{bbox:String},setup(e){const n=(0,i.KR)(null),r=e;return(0,a.sV)((async()=>{n.value=c();const e=r.bbox.split(",")[0],t=r.bbox.split(",")[1],o=r.bbox.split(",")[2],a=r.bbox.split(",")[3];console.log(r.bbox);const i=`https://uas-betrieb.de/geoservices/dipul/wms?service=WMS&version=1.3.0&request=GetMap&layers=dipul:flugplaetze,dipul:flughaefen,dipul:kontrollzonen,dipul:flugbeschraenkungsgebiete,dipul:bundesautobahnen,dipul:bundesstrassen,dipul:bahnanlagen,dipul:binnenwasserstrassen,dipul:seewasserstrassen,dipul:schifffahrtsanlagen,dipul:wohngrundstuecke,dipul:freibaeder,dipul:industrieanlagen,dipul:kraftwerke,dipul:umspannwerke,dipul:stromleitungen,dipul:windkraftanlagen,dipul:justizvollzugsanstalten,dipul:militaerische_anlagen,dipul:labore,dipul:behoerden,dipul:diplomatische_vertretungen,dipul:internationale_organisationen,dipul:polizei,dipul:sicherheitsbehoerden,dipul:krankenhaeuser,dipul:nationalparks,dipul:naturschutzgebiete,dipul:ffh-gebiete,dipul:vogelschutzgebiete,dipul:temporaere_betriebseinschraenkungen,dipul:inaktive_temporaere_betriebseinschraenkungen,dipul:modellflugplaetze&bbox=${e},${t},${o},${a}&width=808&height=500&srs=EPSG:4326&transparent=true&format=image/png`,u=s().latLngBounds([[e,t],[o,a]]),l={opacity:.8};var p=s().imageOverlay(i,u,l);p.addTo(n.value),n.value.fitBounds(u)})),(e,n)=>((0,a.uX)(),(0,a.CE)("div",f))}};const g=h;var v=g,m=r(4232);const k={class:"border-sm p-5 border-gray-900 rounded-md bg-blue-400"},w=(0,a.Lk)("h1",{class:"font-bold text-2xl"},"NOTAM",-1);var x={__name:"NOTAMInfo",props:{bbox:String},setup(e){const n=e,r=(0,i.KR)("No NOTAM available"),t=`https://uas-betrieb.de/geoservices/dipul/wms?i=400\n&j=60\n&service=WMS\n&version=1.3.0\n&request=GetFeatureInfo\n&query_layers=dipul:temporaere_betriebseinschraenkungen\n&layers=dipul:temporaere_betriebseinschraenkungen\n&bbox=${n.bbox}\n&width=808\n&height=500\n&srs=EPSG\n%3A4326\n&feature_count=1`,o=fetch(t);return o.then((e=>e.text())).then((e=>{console.log(e),r.value=e})),(e,n)=>((0,a.uX)(),(0,a.CE)("div",k,[w,(0,a.Lk)("p",null,(0,m.v_)(r.value),1)]))}};const _=x;var y=_,O={__name:"DrohneDashboard",setup(e){const n=window.location.search,r=new URLSearchParams(n),t=r.get("bbox")||"50.919268,11.582480,50.934679,11.602226";return(e,n)=>((0,a.uX)(),(0,a.CE)(a.FK,null,[(0,a.bF)(v,{bbox:(0,i.R1)(t)},null,8,["bbox"]),(0,a.bF)(y,{bbox:(0,i.R1)(t)},null,8,["bbox"])],64))}};const S=O;var z=S;const E=[{path:"/",name:"Dashboard",component:z}],L=(0,o.aE)({history:(0,o.Bt)(),routes:E}),M={id:"app"};var j={__name:"App",setup(e){return(e,n)=>((0,a.uX)(),(0,a.CE)("div",M,[(0,a.bF)(z)]))}};const D=j;var T=D;(0,t.Ef)(T).use(L).mount("#app")}},n={};function r(t){var o=n[t];if(void 0!==o)return o.exports;var a=n[t]={exports:{}};return e[t].call(a.exports,a,a.exports,r),a.exports}r.m=e,function(){var e=[];r.O=function(n,t,o,a){if(!t){var i=1/0;for(p=0;p<e.length;p++){t=e[p][0],o=e[p][1],a=e[p][2];for(var u=!0,s=0;s<t.length;s++)(!1&a||i>=a)&&Object.keys(r.O).every((function(e){return r.O[e](t[s])}))?t.splice(s--,1):(u=!1,a<i&&(i=a));if(u){e.splice(p--,1);var l=o();void 0!==l&&(n=l)}}return n}a=a||0;for(var p=e.length;p>0&&e[p-1][2]>a;p--)e[p]=e[p-1];e[p]=[t,o,a]}}(),function(){r.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return r.d(n,{a:n}),n}}(),function(){r.d=function(e,n){for(var t in n)r.o(n,t)&&!r.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})}}(),function(){r.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){r.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)}}(),function(){var e={524:0};r.O.j=function(n){return 0===e[n]};var n=function(n,t){var o,a,i=t[0],u=t[1],s=t[2],l=0;if(i.some((function(n){return 0!==e[n]}))){for(o in u)r.o(u,o)&&(r.m[o]=u[o]);if(s)var p=s(r)}for(n&&n(t);l<i.length;l++)a=i[l],r.o(e,a)&&e[a]&&e[a][0](),e[a]=0;return r.O(p)},t=self["webpackChunkDrohne_Dashboard"]=self["webpackChunkDrohne_Dashboard"]||[];t.forEach(n.bind(null,0)),t.push=n.bind(null,t.push.bind(t))}();var t=r.O(void 0,[504],(function(){return r(3451)}));t=r.O(t)})();
//# sourceMappingURL=app.bf97b136.js.map