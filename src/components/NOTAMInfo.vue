<template>
  <div class="border-sm p-5 border-gray-900 rounded-md bg-blue-400">
    <h1 class="font-bold text-2xl">NOTAM</h1>
    <p>{{ infoText }}</p>
  </div>
</template>

<script setup>
import { defineProps, ref } from "vue";

const props = defineProps({
  bbox: String,
});

const infoText = ref("No NOTAM available");

const url = `https://uas-betrieb.de/geoservices/dipul/wms?i=400
&j=60
&service=WMS
&version=1.3.0
&request=GetFeatureInfo
&query_layers=dipul:temporaere_betriebseinschraenkungen
&layers=dipul:temporaere_betriebseinschraenkungen
&bbox=${props.bbox}
&width=808
&height=500
&srs=EPSG
%3A4326
&feature_count=1`;
const data = fetch(url);
data
  .then((response) => {
    return response.text();
  })
  .then((text) => {
    console.log(text);
    infoText.value = text;
  });
</script>
