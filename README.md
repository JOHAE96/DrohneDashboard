# Drohne Dashboard

visualize No FlyZones and NOTAMS on a map

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

# Used API:

```txt
https://uas-betrieb.de/geoservices/dipul/wms?service=WMS
&version=1.3.0
&request=GetMap
&layers=dipul:flugplaetze,dipul:flughaefen,dipul:kontrollzonen,dipul:flugbeschraenkungsgebiete,dipul:bundesautobahnen,dipul:bundesstrassen,dipul:bahnanlagen,dipul:binnenwasserstrassen,dipul:seewasserstrassen,dipul:schifffahrtsanlagen,dipul:wohngrundstuecke,dipul:freibaeder,dipul:industrieanlagen,dipul:kraftwerke,dipul:umspannwerke,dipul:stromleitungen,dipul:windkraftanlagen,dipul:justizvollzugsanstalten,dipul:militaerische_anlagen,dipul:labore,dipul:behoerden,dipul:diplomatische_vertretungen,dipul:internationale_organisationen,dipul:polizei,dipul:sicherheitsbehoerden,dipul:krankenhaeuser,dipul:nationalparks,dipul:naturschutzgebiete,dipul:ffh-gebiete,dipul:vogelschutzgebiete,dipul:temporaere_betriebseinschraenkungen,dipul:inaktive_temporaere_betriebseinschraenkungen,dipul:modellflugplaetze
&bbox=50.919268,11.582480,50.934679,11.602226
&width=808
&height=500
&srs=EPSG:4326
&transparent=true
&format=image/png

https://uas-betrieb.de/geoservices/dipul/wms?i=400
&j=60
&service=WMS
&version=1.3.0
&request=GetFeatureInfo
&query_layers=dipul:temporaere_betriebseinschraenkungen
&layers=dipul:temporaere_betriebseinschraenkungen
&bbox=50.919268,11.582480,50.934679,11.602226
&width=808
&height=500
&srs=EPSG
%3A4326
&feature_count=1
```
