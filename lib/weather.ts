export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'fog'
  | 'thunderstorm';

export type WeatherSnapshot = {
  city: string;
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
  hour: number;
};

export function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partlyCloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherSnapshot, 'city'>> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  const current = data.current;
  const hour = new Date().getHours();

  return {
    temperature: Math.round(current.temperature_2m),
    condition: mapWeatherCode(current.weather_code),
    isDay: current.is_day === 1,
    hour,
  };
}

export function weatherMoodBoost(condition: WeatherCondition, temp: number): {
  layerHint: 'light' | 'mid' | 'warm';
  preferIndoor: boolean;
} {
  const preferIndoor = condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm';
  if (temp <= 8) return { layerHint: 'warm', preferIndoor: preferIndoor || temp <= 5 };
  if (temp <= 16) return { layerHint: 'mid', preferIndoor };
  return { layerHint: 'light', preferIndoor };
}
