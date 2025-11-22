import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getWeatherData(city: string) {
  console.log(`🌍 Fetching weather for: ${city}`);
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`;
  
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
      description: data.weather[0].description,
      humidity: data.main.humidity,
    });
  } catch (error) {
    console.error("❌ Weather Fetch Failed:", error);
    return null;
  }
}

export async function POST(req: Request) {
  console.log("💬 --- CHAT API CALLED ---");

  try {
    const { message } = await req.json();
    console.log("📩 User Message:", message);

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_weather",
          description: "Get current weather for a specific city.",
          parameters: {
            type: "object",
            properties: {
              city: { type: "string", description: "City name" },
            },
            required: ["city"],
          },
        },
      },
    ];

    const messages = [
      { role: "system" as const, content: "You are a helpful Japanese travel assistant." },
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
          role: "tool" as const,
          name: "get_weather",
          content: weatherResult || "Error fetching weather.",
        });
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