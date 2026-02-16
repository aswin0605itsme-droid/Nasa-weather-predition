import { GoogleGenAI } from "@google/genai";
import { AIInsight } from "../types";

export const fetchWeatherInsights = async (
  lat: number,
  lon: number,
  historicalTemp: number,
  historicalPrecip: number,
  dateStr: string,
  searchLocation?: string,
  projection?: { days: number; avgTemp: number; avgPrecip: number }
): Promise<AIInsight> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("AI API Key missing");
      return {
        summary: "Configuration Error",
        realTimeComparison: "API Key not configured in environment.",
        advice: "Please check Vercel/local env settings.",
        sources: []
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // We use gemini-3-flash-preview as it supports search grounding
    const modelId = "gemini-3-flash-preview";

    let prompt = "";
    
    // Construct projection text if available
    const projectionText = projection 
        ? `Additionally, my historical model predicts a ${projection.days}-day trend with an average temperature of ${projection.avgTemp.toFixed(1)}°C and average precipitation of ${projection.avgPrecip.toFixed(1)}mm.` 
        : "";

    if (searchLocation) {
        prompt = `
          I am a user searching for weather in "${searchLocation}".
          Today is ${dateStr}.
          
          Please use Google Search to find the ACTUAL current weather forecast for ${searchLocation} for today.
          
          Note: I am comparing this with a historical model (Lat ${lat}, Lon ${lon}) which predicts ${historicalTemp}°C for today.
          ${projectionText}
          
          Format the response strictly as JSON with this structure:
          {
            "summary": "Short summary of forecast for ${searchLocation}.",
            "comparison": "Compare real-time weather with historical baseline AND the ${projection?.days || 7}-day outlook mentioned.",
            "advice": "Actionable advice for ${searchLocation} considering the trend.",
            "current_temp_c": 25.5, 
            "condition": "Sunny/Cloudy/etc"
          }
          Ensure "current_temp_c" is a number representing the actual current temperature in Celsius.
        `;
    } else {
        prompt = `
          I am analyzing weather for a location at Latitude ${lat}, Longitude ${lon}.
          Today is ${dateStr}.
          
          My historical data analysis (averaging past 20 years) predicts for today:
          - Temperature Range: ${historicalTemp}°C
          - Precipitation: ${historicalPrecip} mm
          
          ${projectionText}
          
          Please use Google Search to find the ACTUAL current weather forecast for this location for today.
          
          Format the response strictly as JSON with this structure:
          {
            "summary": "Short summary of current actual weather.",
            "comparison": "Direct comparison: Real-time vs Historical Prediction vs Forecast Trend.",
            "advice": "Actionable advice based on the real-time weather and forecast.",
            "current_temp_c": 25.5,
            "condition": "Sunny/Cloudy/etc"
          }
          Ensure "current_temp_c" is a number representing the actual current temperature in Celsius.
        `;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json", 
      },
    });

    const text = response.text || "";
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || "#"
      }))
      .filter((s: any) => s.uri !== "#") || [];

    let summary = "Analysis complete.";
    let comparison = text;
    let advice = "Check local warnings.";
    let currentTemp = undefined;
    let condition = undefined;

    try {
      // Robust JSON cleaning: Remove markdown blocks if model adds them despite MIME type
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleanText);
      
      summary = json.summary || summary;
      comparison = json.comparison || text; 
      advice = json.advice || advice;
      currentTemp = typeof json.current_temp_c === 'number' ? json.current_temp_c : undefined;
      condition = json.condition;
      
    } catch (e) {
      console.warn("Could not parse JSON from AI response, falling back to text parsing.", e);
      console.log("Raw Text:", text);
      // Fallback parsing for partial JSON or plain text
      if (text.includes("summary")) {
         // rudimentary fallback if needed, but usually raw text is better than nothing
         comparison = text;
      }
    }

    return {
      summary,
      realTimeComparison: comparison,
      advice,
      sources,
      currentTemp,
      condition
    };

  } catch (error) {
    console.error("AI API Error:", error);
    return {
      summary: "AI Analysis Unavailable",
      realTimeComparison: "Could not connect to AI for real-time validation.",
      advice: "Please rely on local weather authorities.",
      sources: []
    };
  }
};