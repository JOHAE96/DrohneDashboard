import L from "leaflet";
import { apiBaseUrl } from "@/config";

const CONFIRMED_IDS_KEY = "drohnendashboard:confirmedSpotIds";
const DISPLAY_NAME_KEY = "drohnendashboard:displayName";

function getConfirmedIds() {
  try {
    return JSON.parse(localStorage.getItem(CONFIRMED_IDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function markConfirmed(spotId) {
  const ids = getConfirmedIds();
  if (!ids.includes(spotId)) {
    ids.push(spotId);
    localStorage.setItem(CONFIRMED_IDS_KEY, JSON.stringify(ids));
  }
}

function getOrAskDisplayName() {
  let name = localStorage.getItem(DISPLAY_NAME_KEY);
  if (!name) {
    name = window.prompt("Wie sollen wir dich nennen?")?.trim();
    if (name) localStorage.setItem(DISPLAY_NAME_KEY, name);
  }
  return name || null;
}

const ZONE_STATUS_LABEL = {
  ok: "✅ keine bekannte Zone",
  restricted: "🚫 in mind. einer geprüften Zone",
  unknown: "❓ Zonen-Check fehlgeschlagen",
};

// Baut den Popup-Inhalt per DOM-API statt HTML-Strings: description/suggestedBy kommen aus
// Discord-Nachrichten (nicht vertrauenswürdig) — über innerHTML wäre das eine Stored-XSS-Lücke
// im Dashboard. textContent entschärft das.
function buildSpotPopup(spot) {
  const container = document.createElement("div");
  container.dataset.testid = "spot-popup";
  container.style.fontSize = "0.85rem";
  container.style.lineHeight = "1.4";

  const title = document.createElement("strong");
  title.dataset.testid = "spot-title";
  title.textContent = spot.description || "Vorgeschlagener Spot";
  title.style.display = "block";
  container.appendChild(title);

  const status = document.createElement("div");
  status.dataset.testid = "spot-status";
  status.textContent = ZONE_STATUS_LABEL[spot.zoneStatus] ?? spot.zoneStatus;
  container.appendChild(status);

  if (spot.zoneNames?.length) {
    const zones = document.createElement("div");
    zones.dataset.testid = "spot-zones";
    zones.textContent = "Zonen: " + spot.zoneNames.join(", ");
    zones.style.color = "#555";
    container.appendChild(zones);
  }

  const meta = document.createElement("div");
  meta.dataset.testid = "spot-meta";
  const confirmationLabel = spot.confirmationCount === 1 ? "Bestätigung" : "Bestätigungen";
  meta.textContent = `Vorgeschlagen von ${spot.suggestedBy} · ${spot.confirmationCount} ${confirmationLabel}`;
  meta.style.color = "#555";
  meta.style.marginBottom = "0.4rem";
  container.appendChild(meta);

  const link = document.createElement("a");
  link.dataset.testid = "spot-link";
  link.href = spot.originalMapsLink;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "In Google Maps öffnen";
  link.style.display = "block";
  link.style.marginBottom = "0.5rem";
  container.appendChild(link);

  const button = document.createElement("button");
  button.dataset.testid = "spot-confirm-button";
  const alreadyConfirmed = getConfirmedIds().includes(spot.id);
  button.textContent = alreadyConfirmed ? "✅ Bestätigt" : "Ich war hier fliegen";
  button.disabled = alreadyConfirmed;
  button.style.padding = "0.3rem 0.6rem";
  button.style.borderRadius = "4px";
  button.style.border = "none";
  button.style.color = "white";
  button.style.background = alreadyConfirmed ? "#95a5a6" : "#27ae60";
  button.style.cursor = alreadyConfirmed ? "default" : "pointer";

  button.addEventListener("click", async () => {
    const name = getOrAskDisplayName();
    if (!name) return;

    button.disabled = true;
    button.textContent = "Wird gespeichert...";
    try {
      const res = await fetch(`${apiBaseUrl}/api/spots/${spot.id}/confirmations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      markConfirmed(spot.id);
      button.textContent = "✅ Bestätigt";
      button.style.background = "#95a5a6";
      button.style.cursor = "default";
    } catch (err) {
      console.error("Bestätigung fehlgeschlagen", err);
      button.disabled = false;
      button.textContent = "Fehler, nochmal versuchen";
      button.style.background = "#27ae60";
    }
  });
  container.appendChild(button);

  return container;
}

function addSpotMarker(map, spot) {
  L.circleMarker([spot.lat, spot.lng], {
    radius: 8,
    color: "#e67e22",
    fillColor: "#e67e22",
    fillOpacity: 0.8,
  })
    .addTo(map)
    .bindPopup(buildSpotPopup(spot));
}

// Kein Live-Sync (siehe docs/architektur-drohnen-spot-bot.md Abschnitt 8) — neue Spots/
// Bestätigungen erscheinen erst nach einem Seiten-Reload.
export async function loadSpots(map) {
  try {
    const res = await fetch(`${apiBaseUrl}/api/spots`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spots = await res.json();
    spots.forEach((spot) => addSpotMarker(map, spot));
  } catch (err) {
    console.error("Konnte Spots nicht laden", err);
  }
}
