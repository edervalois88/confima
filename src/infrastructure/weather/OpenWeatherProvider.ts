import { IWeatherProvider, WeatherForecast } from "../../domain/ports/IWeatherProvider";

/**
 * @fileoverview Adaptador para OpenWeather API.
 * Anillo 4: Infrastructure.
 */

export class OpenWeatherProvider implements IWeatherProvider {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || "";
  }

  public async getForecast(lat: number, lon: number, date: string): Promise<WeatherForecast> {
    console.info(`[WEATHER] Consultando clima para ${lat}, ${lon} en fecha ${date}`);
    
    // Simulación de llamada API con Exponential Backoff manejado por la capa de red/infra
    // En producción se usaría axios o fetch con reintentos
    return {
      tempCelsius: 24,
      condition: "Clear",
      description: "Despejado y soleado, ideal para evento al aire libre."
    };
  }
}
