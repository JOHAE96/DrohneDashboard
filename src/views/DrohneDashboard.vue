<template>
  <DrohneMap :bbox="bbox" />
  <div class="bg-red-500 p-4">Test</div>
</template>

<script setup>
import DrohneMap from "@/components/DrohneMap.vue";

//query parameter from url: boundingbox as csv
const query = window.location.search;
const urlParams = new URLSearchParams(query);
const bbox = urlParams.get("bbox");
</script>
