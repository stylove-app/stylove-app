import { parseForecastDate, type DailyWeatherSummary } from '@/lib/weather';
import type { TravelPlan } from '@/lib/travel-engine';
import { supabase } from '@/services/supabase';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(plan: TravelPlan): { startDate: string; endDate: string } {
  const start = parseForecastDate(plan.departureDate);
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(plan.duration - 1, 0));
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

function firstWeatherDay(plan: TravelPlan): DailyWeatherSummary | undefined {
  return plan.weatherDays[0];
}

export async function saveTravelPlan(userId: string, plan: TravelPlan): Promise<void> {
  const { startDate, endDate } = resolveDateRange(plan);
  const firstWeather = firstWeatherDay(plan);
  const { error } = await supabase.from('travel_plans').insert({
    user_id: userId,
    destination: plan.destination,
    destination_lat: firstWeather?.latitude ?? plan.weather.latitude ?? null,
    destination_lon: firstWeather?.longitude ?? plan.weather.longitude ?? null,
    start_date: startDate,
    end_date: endDate,
    travel_type: plan.vibe,
    baggage_type: plan.baggageType,
    plan_json: plan,
  });

  if (error) throw error;
}
