import L from "leaflet";
import { markerOption } from "./customMarker";

export const setupMap = () => {
  const map = L.map("map", {
    preferCanvas: false,
  }).setView([50.927487905728235, 11.594333244037017], 25);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  L.marker([50.927487905728235, 11.594333244037017], markerOption)
    .addTo(map)
    .bindPopup("Landfeste");
  L.marker([50.92312263435002, 11.586930178792763], markerOption)
    .addTo(map)
    .bindPopup("Hängemattenspot");

  return map;
};
