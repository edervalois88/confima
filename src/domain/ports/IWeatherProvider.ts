/**
 * @fileoverview Interfaz para proveedores de clima externos.
 * Anillo 1: Domain Ports.
 */

export interface WeatherForecast {
  tempCelsius: number;
  condition: string; // ej: 'Clear', 'Rain'
  description: string;
}

export interface IWeatherProvider {
  /**
   * Obtiene el pronóstico para una ubicación y fecha específica.
   */
  getForecast(lat: number, lon: number, date: string): Promise<WeatherForecast>;
}
