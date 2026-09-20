import L from "leaflet";
import { markerOption } from "./customMarker";
import spotsToFly from "../spotsToFly";
import cameras from "../cameras";

export const setupMap = (showCameras = false) => {
  const map = L.map("map", {
    preferCanvas: false,
  }).setView([50.927487905728235, 11.594333244037017], 25);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  if (showCameras) {
    cameras.forEach((spot) => {
      addMarker(map, spot.coorinades, spot.name);
    });
  } else {
    spotsToFly.forEach((spot) => {
      addMarker(map, spot.coorinades, spot.name);
    });
  }

  return map;
};

const addMarker = (map, coorinades, name) => {
  L.marker(coorinades, markerOption).addTo(map).bindPopup(name);
};
