<template>
  <DrohneMap :bbox="bbox" />
  <NOTAMInfo :bbox="bbox" />
</template>

<script setup>
import DrohneMap from "@/components/DrohneMap.vue";
import NOTAMInfo from "@/components/NOTAMInfo.vue";

//query parameter from url: boundingbox as csv
const query = window.location.search;
const urlParams = new URLSearchParams(query);
const bbox = urlParams.get("bbox") || "50.919268,11.582480,50.934679,11.602226";
</script>
