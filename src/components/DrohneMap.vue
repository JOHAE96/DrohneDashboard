<template>
  <div id="map"></div>
</template>

<script setup>
import { ref, onMounted, defineProps } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { setupMap } from "@/helper";
const map = ref(null);

const props = defineProps({
  bbox: String,
});

onMounted(async () => {
  map.value = setupMap();

  const minLat = 50.919268;
  const minLng = 11.58248;
  const maxLat = 50.934679;
  const maxLng = 11.602226;

  console.log(props.bbox);

  const imageUrl = `https://uas-betrieb.de/geoservices/dipul/wms?service=WMS&version=1.3.0&request=GetMap&layers=dipul:flugplaetze,dipul:flughaefen,dipul:kontrollzonen,dipul:flugbeschraenkungsgebiete,dipul:bundesautobahnen,dipul:bundesstrassen,dipul:bahnanlagen,dipul:binnenwasserstrassen,dipul:seewasserstrassen,dipul:schifffahrtsanlagen,dipul:wohngrundstuecke,dipul:freibaeder,dipul:industrieanlagen,dipul:kraftwerke,dipul:umspannwerke,dipul:stromleitungen,dipul:windkraftanlagen,dipul:justizvollzugsanstalten,dipul:militaerische_anlagen,dipul:labore,dipul:behoerden,dipul:diplomatische_vertretungen,dipul:internationale_organisationen,dipul:polizei,dipul:sicherheitsbehoerden,dipul:krankenhaeuser,dipul:nationalparks,dipul:naturschutzgebiete,dipul:ffh-gebiete,dipul:vogelschutzgebiete,dipul:temporaere_betriebseinschraenkungen,dipul:inaktive_temporaere_betriebseinschraenkungen,dipul:modellflugplaetze&bbox=${minLat},${minLng},${maxLat},${maxLng}&width=808&height=500&srs=EPSG:4326&transparent=true&format=image/png`;
  const latLngBounds = L.latLngBounds([
    [minLat, minLng],
    [maxLat, maxLng],
  ]);
  const options = {
    opacity: 0.8,
  };
  var imageOverlay = L.imageOverlay(imageUrl, latLngBounds, options);
  imageOverlay.addTo(map.value);
  map.value.fitBounds(latLngBounds);
});
</script>

<style lang="scss">
#map {
  width: 100%;
  height: 100vh;
}
</style>
