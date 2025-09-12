// API Keys
const WEATHER_API_KEY = window.config.WEATHER_API_KEY;
const API_KEY_PEXELS = window.config.API_KEY_PEXELS;


// DOM elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const loading = document.getElementById("loading");
const gallery = document.querySelectorAll("gallery");

// Weather display elements
const locationEl = document.getElementById("location");
const dateEl = document.getElementById("date");
const tempEl = document.getElementById("temp");
const conditionsEl = document.getElementById("conditions");
const weatherIconEl = document.getElementById("weather-icon");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const visibilityEl = document.getElementById("visibility");
const forecastEl = document.getElementById("forecast");

let currentCity = "";

// Show/hide loading
function showLoading() {
  loading.classList.add("show");
}

function hideLoading() {
  loading.classList.remove("show");
}

// Format date
function formatDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return now.toLocaleDateString("en-US", options);
}

// Background functions (from your main project)
async function fetchCityBackground(city) {
  const query = `${city} landmark`;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=11&orientation=landscape`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: API_KEY_PEXELS },
    });
    const data = await res.json();

    if (data.photos && data.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.photos.length);
      const highRes = data.photos[randomIndex].src.large2x;
      document.body.style.backgroundImage = `url(${highRes})`;
      updateGallery(data.photos);
    }
  } catch (err) {
    console.error("Pexels API Error:", err);
  }
}

function updateGallery(photos) {
  const galleryCards = document.querySelectorAll(".info-card");

  // We fetch 10 images, use 1 for background, so we have up to 9 for gallery
  const availableImages = photos.slice(1); // Skip the main background image

  console.log(`Available images for gallery: ${availableImages.length}`);
  console.log(`Gallery cards: ${galleryCards.length}`);

  galleryCards.forEach((card, index) => {
    if (availableImages[index]) {
      const photo = availableImages[index];
      card.style.backgroundImage = `url(${photo.src.large})`;
      card.style.backgroundAttachment = "scroll";
      card.style.opacity = "1"; // Show card
    } else {
      // Hide cards that don't have images
      card.style.backgroundImage = "none";
      card.style.opacity = "0.3"; // Fade out empty cards
    }
  });
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

// Weather API functions
async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("City not found");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Weather API Error:", error);
    throw error;
  }
}

async function fetchForecastData(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("Forecast not found");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Forecast API Error:", error);
    return null;
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("Location not found");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Weather API Error:", error);
    throw error;
  }
}

// Update weather display
function updateWeatherDisplay(weatherData) {
  const { name, main, weather, wind, visibility, sys } = weatherData;

  locationEl.textContent = `${name}, ${sys.country}.`;
  dateEl.textContent = formatDate();
  tempEl.textContent = `${Math.round(main.temp)}°C`;
  conditionsEl.textContent = weather[0].description;

  // Weather icon
  const iconCode = weather[0].icon;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  weatherIconEl.alt = weather[0].description;

  // Details
  feelsLikeEl.textContent = `Feels like: ${Math.round(main.feels_like)}°C`;
  humidityEl.textContent = `Humidity: ${main.humidity}%`;
  windSpeedEl.textContent = `Wind: ${Math.round(wind.speed * 3.6)} km/h`;
  visibilityEl.textContent = `Visibility: ${Math.round(visibility / 1000)} km`;
}

// Update forecast display
function updateForecastDisplay(forecastData) {
  if (!forecastData || !forecastData.list) return;

  forecastEl.innerHTML = "";

  // Get daily forecasts (every 8th item = 24 hours apart)
  const dailyForecasts = forecastData.list
    .filter((_, index) => index % 8 === 0)
    .slice(0, 5);

  dailyForecasts.forEach((forecast, index) => {
    const date = new Date(forecast.dt * 1000);
    const dayName =
      index === 0
        ? "Today"
        : date.toLocaleDateString("en-US", { weekday: "short" });

    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.innerHTML = `
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon">
                        <img src="https://openweathermap.org/img/wn/${
                          forecast.weather[0].icon
                        }@2x.png" alt="${forecast.weather[0].description}">
                    </div>
                    <div class="forecast-temp">
                        <span class="forecast-high">${Math.round(
                          forecast.main.temp_max
                        )}°</span>
                        <span class="forecast-low">${Math.round(
                          forecast.main.temp_min
                        )}°</span>
                    </div>
                `;
    forecastEl.appendChild(forecastItem);
  });
}

// Main function to get weather and update background
async function getWeatherAndBackground(city) {
  showLoading();

  try {
    // Fetch weather data
    const weatherData = await fetchWeatherData(city);
    const forecastData = await fetchForecastData(city);

    // Update displays
    updateWeatherDisplay(weatherData);
    updateForecastDisplay(forecastData);

    // Update background
    await fetchCityBackground(city);

    currentCity = city;
    cityInput.value = "";
  } catch (error) {
    showError("City not found. Please try again.");
  } finally {
    hideLoading();
  }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  showLoading();

  try {
    const weatherData = await fetchWeatherByCoords(lat, lon);
    const city = weatherData.name;

    // Get forecast for this city
    const forecastData = await fetchForecastData(city);

    updateWeatherDisplay(weatherData);
    updateForecastDisplay(forecastData);

    // Update background
    await fetchCityBackground(city);

    currentCity = city;
  } catch (error) {
    showError("Unable to get weather for your location.");
  } finally {
    hideLoading();
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;

  document.querySelector(".weather-app").prepend(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Event listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    getWeatherAndBackground(city);
  }
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) {
      getWeatherAndBackground(city);
    }
  }
});

locationBtn.addEventListener("click", () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        showError(
          "Unable to access your location. Please search for a city manually."
        );
      }
    );
  } else {
    showError("Geolocation is not supported by your browser.");
  }
});

// Initialize app (same as your main project)
function initApp() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await getCityFromCoords(latitude, longitude);
        console.log("Detected city:", city);
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation failed, using default city.");
        getWeatherAndBackground("New York");
      }
    );
  } else {
    console.warn("Geolocation not supported, using default city.");
    getWeatherAndBackground("New York");
  }
}

// Start the app
initApp();
