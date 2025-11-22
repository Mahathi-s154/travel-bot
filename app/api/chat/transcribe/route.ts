import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Send audio to Groq Whisper v3
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      language: "ja", // Enforce Japanese detection for this assignment
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
    
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}