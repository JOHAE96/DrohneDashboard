import { describe, test, expect, beforeEach, vi } from "vitest";

const circleMarkerInstance = {
  addTo: vi.fn(function () {
    return this;
  }),
  bindPopup: vi.fn(function () {
    return this;
  }),
};
const circleMarker = vi.fn(() => circleMarkerInstance);

vi.mock("leaflet", () => ({
  default: { circleMarker },
}));

vi.mock("@/config", () => ({ apiBaseUrl: "http://api.test" }));

const { loadSpots } = await import("./spots.js");

const CONFIRMED_IDS_KEY = "drohnendashboard:confirmedSpotIds";
const DISPLAY_NAME_KEY = "drohnendashboard:displayName";

const SPOT = {
  id: "spot-1",
  lat: 50.927,
  lng: 11.589,
  originalMapsLink: "https://maps.app.goo.gl/34RRdMdeiuuXoYai7",
  description: "Landfeste",
  suggestedBy: "testuser",
  zoneStatus: "restricted",
  zoneNames: ["Bundesstraße", "Bahnanlage"],
  confirmationCount: 2,
};

function makeFetch({ spots = [SPOT], confirm = { ok: true, status: 204 } } = {}) {
  return vi.fn(async (url) => {
    const href = String(url);
    if (href.endsWith("/confirmations")) {
      if (confirm.reject) throw confirm.reject;
      return { ok: confirm.ok, status: confirm.status };
    }
    if (href.endsWith("/api/spots")) {
      return { ok: true, status: 200, json: async () => spots };
    }
    throw new Error(`Unerwarteter fetch-Aufruf: ${href}`);
  });
}

function popupFromLastCall() {
  const calls = circleMarkerInstance.bindPopup.mock.calls;
  return calls[calls.length - 1][0];
}

const FAKE_MAP = {};

beforeEach(() => {
  localStorage.clear();
  circleMarker.mockClear();
  circleMarkerInstance.addTo.mockClear();
  circleMarkerInstance.bindPopup.mockClear();
  vi.restoreAllMocks();
});

describe("loadSpots", () => {
  test("legt für jeden Spot einen orangen circleMarker an der richtigen Position an", async () => {
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    expect(circleMarker).toHaveBeenCalledWith(
      [SPOT.lat, SPOT.lng],
      expect.objectContaining({ radius: 8, color: "#e67e22", fillColor: "#e67e22" })
    );
    expect(circleMarkerInstance.addTo).toHaveBeenCalledWith(FAKE_MAP);
    expect(circleMarkerInstance.bindPopup).toHaveBeenCalledTimes(1);
  });

  test("Popup zeigt description, Zonen-Status, betroffene Zonen und Bestätigungs-Anzahl", async () => {
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    const popup = popupFromLastCall();
    expect(popup.querySelector('[data-testid="spot-title"]').textContent).toBe("Landfeste");
    expect(popup.querySelector('[data-testid="spot-status"]').textContent).toContain("🚫");
    expect(popup.querySelector('[data-testid="spot-zones"]').textContent).toBe(
      "Zonen: Bundesstraße, Bahnanlage"
    );
    expect(popup.querySelector('[data-testid="spot-meta"]').textContent).toBe(
      "Vorgeschlagen von testuser · 2 Bestätigungen"
    );
    const link = popup.querySelector('[data-testid="spot-link"]');
    expect(link.href).toBe(SPOT.originalMapsLink);
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
  });

  test("Popup-Titel fällt auf 'Vorgeschlagener Spot' zurück, wenn description fehlt", async () => {
    global.fetch = makeFetch({ spots: [{ ...SPOT, description: null }] });
    await loadSpots(FAKE_MAP);

    const popup = popupFromLastCall();
    expect(popup.querySelector('[data-testid="spot-title"]').textContent).toBe(
      "Vorgeschlagener Spot"
    );
  });

  test("Zonen-Zeile fehlt komplett, wenn zoneNames leer ist", async () => {
    global.fetch = makeFetch({
      spots: [{ ...SPOT, zoneStatus: "ok", zoneNames: [] }],
    });
    await loadSpots(FAKE_MAP);

    const popup = popupFromLastCall();
    expect(popup.querySelector('[data-testid="spot-zones"]')).toBeNull();
    expect(popup.querySelector('[data-testid="spot-status"]').textContent).toContain("✅");
  });

  test('Bestätigungs-Label ist Singular bei genau 1', async () => {
    global.fetch = makeFetch({ spots: [{ ...SPOT, confirmationCount: 1 }] });
    await loadSpots(FAKE_MAP);

    const popup = popupFromLastCall();
    expect(popup.querySelector('[data-testid="spot-meta"]').textContent).toContain(
      "1 Bestätigung"
    );
    expect(popup.querySelector('[data-testid="spot-meta"]').textContent).not.toContain(
      "1 Bestätigungen"
    );
  });

  test("Fehler beim Laden von /api/spots wird abgefangen, kein Marker wird angelegt", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadSpots(FAKE_MAP)).resolves.toBeUndefined();
    expect(circleMarker).not.toHaveBeenCalled();
  });

  test("Netzwerkfehler beim Laden von /api/spots wird abgefangen", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadSpots(FAKE_MAP)).resolves.toBeUndefined();
    expect(circleMarker).not.toHaveBeenCalled();
  });
});

describe("Bestätigen-Button", () => {
  test("zeigt 'Ich war hier fliegen', wenn dieser Spot in diesem Browser noch nicht bestätigt wurde", async () => {
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    expect(button.textContent).toBe("Ich war hier fliegen");
    expect(button.disabled).toBe(false);
  });

  test("ist deaktiviert und zeigt '✅ Bestätigt', wenn die Spot-ID schon in localStorage steht", async () => {
    localStorage.setItem(CONFIRMED_IDS_KEY, JSON.stringify([SPOT.id]));
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    expect(button.textContent).toBe("✅ Bestätigt");
    expect(button.disabled).toBe(true);
  });

  test("fragt beim ersten Klick per prompt() nach einem Namen, merkt ihn sich und bestätigt", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Alice");
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    button.click();

    await vi.waitFor(() => expect(button.textContent).toBe("✅ Bestätigt"));
    expect(button.disabled).toBe(true);
    expect(window.prompt).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBe("Alice");
    expect(JSON.parse(localStorage.getItem(CONFIRMED_IDS_KEY))).toEqual([SPOT.id]);

    const confirmCall = global.fetch.mock.calls.find((c) => String(c[0]).endsWith("/confirmations"));
    expect(confirmCall[0]).toBe(`http://api.test/api/spots/${SPOT.id}/confirmations`);
    expect(JSON.parse(confirmCall[1].body)).toEqual({ name: "Alice" });
  });

  test("nutzt einen bereits gespeicherten Anzeigenamen ohne erneut zu fragen", async () => {
    localStorage.setItem(DISPLAY_NAME_KEY, "Bob");
    const promptSpy = vi.spyOn(window, "prompt");
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    button.click();

    await vi.waitFor(() => expect(button.textContent).toBe("✅ Bestätigt"));
    expect(promptSpy).not.toHaveBeenCalled();
    const confirmCall = global.fetch.mock.calls.find((c) => String(c[0]).endsWith("/confirmations"));
    expect(JSON.parse(confirmCall[1].body)).toEqual({ name: "Bob" });
  });

  test("bricht ab, wenn der Nutzer den Namens-Prompt abbricht — kein Request, Button bleibt aktiv", async () => {
    vi.spyOn(window, "prompt").mockReturnValue(null);
    global.fetch = makeFetch();
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    button.click();
    await Promise.resolve();

    expect(button.textContent).toBe("Ich war hier fliegen");
    expect(button.disabled).toBe(false);
    expect(
      global.fetch.mock.calls.some((c) => String(c[0]).endsWith("/confirmations"))
    ).toBe(false);
  });

  test("zeigt bei fehlgeschlagenem Bestätigen einen Fehlertext und aktiviert den Button wieder", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Alice");
    global.fetch = makeFetch({ confirm: { ok: false, status: 500 } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    button.click();

    await vi.waitFor(() => expect(button.textContent).toBe("Fehler, nochmal versuchen"));
    expect(button.disabled).toBe(false);
    expect(localStorage.getItem(CONFIRMED_IDS_KEY)).toBeNull();
  });

  test("behandelt einen Netzwerkfehler beim Bestätigen wie einen Fehlschlag", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Alice");
    global.fetch = makeFetch({ confirm: { reject: new Error("network down") } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await loadSpots(FAKE_MAP);

    const button = popupFromLastCall().querySelector('[data-testid="spot-confirm-button"]');
    button.click();

    await vi.waitFor(() => expect(button.textContent).toBe("Fehler, nochmal versuchen"));
    expect(button.disabled).toBe(false);
  });
});
