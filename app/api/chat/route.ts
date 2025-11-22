import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Define the Weather Helper Function
async function getWeatherData(city: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OpenWeather API Key missing");

  // Fetch weather in Metric (Celsius) and Japanese
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.stringify({
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
    });
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 2. Define the available tools for the AI
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_weather",
          description: "Get current weather for a specific city. Use this when the user asks about weather or climate.",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "The name of the city (e.g., Tokyo, Paris)",
              },
            },
            required: ["city"],
          },
        },
      },
    ];

    const messages = [
      {
        role: "system" as const,
        content: "You are a helpful Japanese travel assistant. If the user asks for a travel plan, suggest an itinerary. If they ask about weather, use the tool provided. Always respond in Japanese."
      },
      { role: "user" as const, content: message }
    ];

    // 3. First Call: Ask AI what to do
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      tools: tools,
      tool_choice: "auto", // Let AI decide
    });

    const responseMessage = completion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // 4. Check if AI wants to call a tool (Weather)
    if (toolCalls) {
      // Prepare a new message history including the tool call
      const newMessages = [...messages, responseMessage];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        if (functionName === "get_weather") {
          const weatherResult = await getWeatherData(functionArgs.city);
          
          // Add the tool result to the conversation
          newMessages.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            name: "get_weather",
            content: weatherResult || "Could not fetch weather.",
          });
        }
      }

      // 5. Second Call: AI generates final answer using the weather data
      const secondResponse = await groq.chat.completions.create({
        messages: newMessages,
        model: "llama-3.3-70b-versatile",
      });

      return NextResponse.json({ reply: secondResponse.choices[0].message.content });
    }

    // If no tool was called, just return the direct response
    return NextResponse.json({ reply: responseMessage.content });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}