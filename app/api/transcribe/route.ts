import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  console.log("🎤 --- TRANSCRIBE API CALLED ---");
  
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    // 1. Get language from frontend (default to 'ja' if missing)
    // This allows the backend to switch between English and Japanese listening modes
    const language = (formData.get("language") as string) || "ja";

    // 2. Check if file exists
    if (!file) {
      console.error("❌ Error: No 'file' field in FormData.");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. Log File Details & Language Mode
    console.log(`📄 File Name: ${file.name}`);
    console.log(`KB File Size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`🗣️ Listening Language: ${language.toUpperCase()}`);

    if (file.size === 0) {
      console.error("❌ Error: File size is 0 bytes. Recording failed on frontend.");
      return NextResponse.json({ error: "Empty file received" }, { status: 400 });
    }

    // 4. Send to Groq Whisper
    console.log("🚀 Sending to Groq Whisper...");
    
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      language: language, // <--- DYNAMIC LANGUAGE HERE
      response_format: "json",
    });

    console.log("✅ Groq Transcription Success:");
    console.log(`"${transcription.text}"`);

    return NextResponse.json({ text: transcription.text });
    
  } catch (error: any) {
    console.error("🔥 TRANSCRIPTION FAILED 🔥");
    console.error("Message:", error.message);
    
    if (error.response) {
      console.error("Groq API Data:", error.response.data);
    }
    
    return NextResponse.json({ 
      error: "Transcription failed", 
      details: error.message 
    }, { status: 500 });
  }
}