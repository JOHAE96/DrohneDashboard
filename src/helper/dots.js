import L from "leaflet";
import { formatTimeStampToDateAndTime } from "./date";

const myRenderer = L.canvas({ padding: 0.5 });

const drawSingleDot = (entry, map, settings, name = "", color = "green") => {
  const formatedTimeStamp = formatTimeStampToDateAndTime(entry.timeStamp);
  const radius = settings.horizontalAccuracyAsSize
    ? entry.horizontalAccuracy
    : settings.dotSize;
  L.circleMarker(entry.pos, {
    renderer: myRenderer,
    color,
    radius,
  })
    .addTo(map)
    .bindPopup(`${name} - ${formatedTimeStamp}`);
};

export const drawDots = (coordinates, map, settings) => {
  console.log("draw Dots");

  // https://stackoverflow.com/questions/43015854/large-dataset-of-markers-or-dots-in-leaflet
  if (settings.showBoots) {
    coordinates.boots.forEach((entry) => {
      drawSingleDot(entry, map, settings, "boots", "blue");
    });
  }
  if (settings.showFriday) {
    coordinates.friday.forEach((entry) => {
      drawSingleDot(entry, map, settings, "friday", "red");
    });
  }
  if (settings.showWednesday) {
    coordinates.wednesday.forEach((entry) => {
      drawSingleDot(entry, map, settings, "wednesday", "yellow");
    });
  }
};
