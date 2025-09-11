const API_KEY_PEXELS = window.config.API_KEY_PEXELS;

async function fetchCityBackground(city) {
  const query = `${city} landmark`;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=10&orientation=landscape`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: API_KEY_PEXELS },
    });

    const data = await res.json();

    if (data.photos && data.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.photos.length);
      const highRes = data.photos[randomIndex].src.large2x;
      document.body.style.backgroundImage = `url(${highRes})`;
    }
  } catch (err) {
    console.error("Pexels API Error:", err);
  }
}

async function getCityFromCoords(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      "New York"
    );
  } catch (err) {
    console.error("Geocoding Error:", err);
    return "New York";
  }
}

function setBackgroundFromLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await getCityFromCoords(latitude, longitude);
        console.log("Detected city:", city);
        fetchCityBackground(city);
      },
      (error) => {
        console.warn("Geolocation failed, using default city.");
        fetchCityBackground("New York");
      }
    );
  } else {
    console.warn("Geolocation not supported, using default city.");
    fetchCityBackground("New York");
  }
}

setBackgroundFromLocation();
