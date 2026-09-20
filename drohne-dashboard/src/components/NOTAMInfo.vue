<template>
  <div
    class="border-sm p-5 border-gray-900 rounded-md"
    :class="{
      'bg-green-400': notamState === 'free',
      'bg-yellow-400': notamState === 'loading',
      'bg-red-400': notamState === 'not-free',
    }"
  >
    <h1 class="text-xl">NOTAM</h1>
    <p class="font-bold text-2xl">{{ infoText }}</p>
  </div>
</template>

<script setup>
import { computed, defineProps, ref } from "vue";

const props = defineProps({
  bbox: String,
});

const infoText = ref("Checking for NOTAMs...");

const notamState = computed(() => {
  switch (infoText.value.trim()) {
    case "Checking for NOTAMs...":
      return "loading";
    case "no features were found":
      return "free";
    default:
      return "not-free";
  }
});

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
