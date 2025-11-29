import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSalesCall = async (base64Audio: string, mimeType: string): Promise<AnalysisResult> => {
  
  const prompt = `
    You are an expert sales coaching AI. Analyze the provided audio file of a sales call.
    
    Perform the following tasks:
    1. **Language Detection**: Detect the primary language of the audio.
    2. **Diarized Transcript**: Generate a transcript. Distinguish speakers.
       - **CRITICAL**: You MUST infer the roles of the speakers based on the content (e.g., who is asking qualifying questions vs who is answering).
       - Label the representative as "Salesperson" (translated into the detected audio language).
       - Label the customer as "Prospect" (translated into the detected audio language).
       - Only use "Speaker A/B" if roles are absolutely ambiguous.
       - Include precise start and end timestamps for each segment (e.g., "00:15", "00:22").
    3. **Sentiment Analysis**: Analyze the engagement and sentiment level throughout the call. 
       - **CRITICAL**: Identify exactly 10-15 distinct time points distributed EVENLY across the entire duration.
       - Score from 0 (Negative/Disengaged) to 100 (Positive/Highly Engaged).
       - Be consistent and strict with scoring.
    4. **Coaching Card**: Identify 3 Strengths and 3 Improvements for the salesperson.
    5. **Summary**: A 2-sentence executive summary.
    6. **Key Topics**: 5-7 key topics discussing objections or features.

    **CRITICAL OUTPUT RULE**: 
    - Verify the language of the spoken audio. 
    - Output ALL text (summary, transcript, coaching points, topics) in that **EXACT SAME LANGUAGE**. 
    - Do not translate to English if the audio is not English. Do not translate to Russian if the audio is English.
    
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        temperature: 0, // Force deterministic output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Executive summary of the call." },
            topics: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of 5-7 key topics discussed."
            },
            transcript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  timestamp: { type: Type.STRING, description: "Start time (e.g. 00:15)" },
                  endTime: { type: Type.STRING, description: "End time (e.g. 00:22)" },
                  text: { type: Type.STRING }
                }
              }
            },
            sentiment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timePoint: { type: Type.STRING, description: "Timestamp or Label for the point in time" },
                  score: { type: Type.NUMBER, description: "0-100 score" },
                  context: { type: Type.STRING, description: "Why this score was given" }
                }
              }
            },
            coaching: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};