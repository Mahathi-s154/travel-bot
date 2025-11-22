import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getWeatherData(city: string) {
  console.log(`🌍 Fetching weather for: ${city}`);
  const apiKey = process.env.OPENWEATHER_API_KEY;
  // Removed '&lang=ja' so the AI gets raw data and translates it dynamically
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`❌ Weather API Error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    console.log("✅ Weather Data Received:", data.weather[0].description, data.main.temp);
    
    return JSON.stringify({
      location: data.name,
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      clouds: data.clouds.all,
      visibility: data.visibility,
    });
  } catch (error) {
    console.error("❌ Weather Fetch Failed:", error);
    return null;
  }
}

export async function POST(req: Request) {
  console.log("💬 --- CHAT API CALLED ---");

  try {
    // Extract message AND language from the request
    const { message, language } = await req.json();
    const userLang = language || 'English';
    
    console.log(`📩 User Message: "${message}" | Language Mode: ${userLang}`);

    // Dynamic System Prompt based on selected language
    const systemPrompt = `
      You are a helpful travel assistant specializing in Japan travel planning.
      
      User Preference: The user's interface is set to ${userLang}.
      
      Instructions:
      1. Detect the language of the user's message.
      2. If they speak Japanese or the interface is Japanese, reply in Japanese.
      3. If they speak English or the interface is English, reply in English.
      4. **IMPORTANT: When users ask about travel plans, itineraries, or activities, ALWAYS check the weather first using the 'get_weather' tool.**
      5. Base your recommendations on current weather conditions:
         - Suggest indoor activities (museums, shopping, temples) on rainy days
         - Recommend outdoor activities (parks, hiking, sightseeing) on sunny days
         - Advise on appropriate clothing based on temperature
         - Warn about extreme weather conditions (too hot, too cold, storms)
      6. When asked about specific cities or regions, fetch weather data to provide accurate, weather-appropriate suggestions.
      7. Keep responses concise, friendly, and helpful for travelers.
      8. Always mention the current weather conditions when making recommendations.
    `;

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_weather",
          description: "Get current weather for a specific city. Use this tool when users ask about travel plans, itineraries, activities, or explicitly mention a city. Weather data should inform your recommendations.",
          parameters: {
            type: "object",
            properties: {
              city: { 
                type: "string", 
                description: "City name (e.g., Tokyo, Kyoto, Osaka)" 
              },
            },
            required: ["city"],
          },
        },
      },
    ];

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: message }
    ];

    console.log("🤖 Asking Llama 3.3 (Phase 1)...");
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = completion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      console.log("🔧 Tool Call Detected:", toolCalls[0].function.name);
      
      const newMessages = [...messages, responseMessage];

      for (const toolCall of toolCalls) {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        console.log("🔧 Arguments:", functionArgs);
        
        const weatherResult = await getWeatherData(functionArgs.city);
        
        newMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "get_weather",
          content: weatherResult || "Error fetching weather.",
        } as any);
      }

      console.log("🤖 Asking Llama 3.3 (Phase 2 - With Data)...");
      const secondResponse = await groq.chat.completions.create({
        messages: newMessages,
        model: "llama-3.3-70b-versatile",
      });

      console.log("✅ Final Response:", secondResponse.choices[0].message.content);
      return NextResponse.json({ reply: secondResponse.choices[0].message.content });
    }

    console.log("✅ Direct Response (No Tool):", responseMessage.content);
    return NextResponse.json({ reply: responseMessage.content });

  } catch (error: any) {
    console.error("🔥 CHAT API FAILED 🔥", error);
    return NextResponse.json({ error: "Chat failed", details: error.message }, { status: 500 });
  }
}