import { WeatherData } from '../types';

export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    const data = await response.json();
    
    // Map WMO codes to text
    const code = data.current.weather_code;
    let condition = "Clear";
    if (code > 0 && code <= 3) condition = "Cloudy";
    if (code >= 45 && code <= 48) condition = "Foggy";
    if (code >= 51 && code <= 67) condition = "Rainy";
    if (code >= 71) condition = "Snowy";
    if (code >= 95) condition = "Stormy";

    return {
      temp: Math.round(data.current.temperature_2m),
      condition,
      city: "Current Location" // Reverse geocoding requires an API key usually, keeping it simple
    };
  } catch (e) {
    console.error("Weather fetch failed", e);
    return { temp: 22, condition: "Sunny", city: "Local" };
  }
};