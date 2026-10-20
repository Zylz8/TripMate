const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";

function primaryPlaceName(address = {}, fallback = "") {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    fallback.split(",")[0]?.trim() ||
    fallback
  );
}

function regionName(address = {}) {
  return address.state || address.province || address.region || address.county || "";
}

function mapResult(item) {
  const address = item.address || {};

  return {
    id: item.place_id,
    name: primaryPlaceName(address, item.display_name),
    formattedName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    city: primaryPlaceName(address, item.display_name),
    region: regionName(address),
    country: address.country || "",
    countryCode: address.country_code || "",
    type: item.type || item.class || "",
  };
}

export async function geocodePlace(placeName, options = {}) {
  try {
    const isListRequested = options.returnList === true;

    const params = new URLSearchParams({
      q: placeName,
      format: "json",
      limit: isListRequested ? "5" : "1",
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      headers: {
        "User-Agent": "TripMate App",
      },
    });

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      if (isListRequested) {
        return data.map(mapResult);
      }

      const result = mapResult(data[0]);
      return { ...result, displayName: result.formattedName };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function geocodePlaces(placeNames) {
  const promises = placeNames.map(async (name) => {
    const coords = await geocodePlace(name);
    if (coords) {
      return { name, ...coords };
    }
    return null;
  });

  return Promise.all(promises);
}
