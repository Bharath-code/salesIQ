import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Lazy initialization - only create client when needed
let ai: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing API Key: Please create a .env.local file with GEMINI_API_KEY=your_key_here"
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const analyzeSalesCall = async (base64Audio: string, mimeType: string): Promise<AnalysisResult> => {
  const client = getAIClient();

  const prompt = `
    You are an ELITE sales coach who has analyzed 10,000+ sales calls. You think like a VP of Sales at a high-growth SaaS company.
    
    Analyze this sales call with BRUTAL HONESTY and SPECIFIC, ACTIONABLE feedback.

    ## ANALYSIS TASKS

    ### 1. CALL CLASSIFICATION
    Determine the call type:
    - "discovery" = Qualification call, understanding prospect needs
    - "demo" = Product demonstration or walkthrough
    - "negotiation" = Price/terms discussion
    - "closing" = Final decision push
    - "renewal" = Existing customer retention
    - "other" = Doesn't fit above categories

    ### 2. SPEAKER DIARIZATION
    Generate a transcript with speaker labels.
    - Infer roles from context: Who asks qualifying questions? Who answers about their company?
    - Label as "Salesperson" and "Prospect" (or translated equivalents in detected language)
    - Include precise timestamps (start and end)

    ### 3. SALES METRICS (Calculate precisely)
    - **Talk Ratio**: Percentage of time Salesperson talked (ideal: 30-40%)
    - **Question Count**: Number of open/closed questions Salesperson asked
    - **Filler Words**: Count of "um", "uh", "like", "you know" by Salesperson
    - **Longest Monologue**: Longest uninterrupted speaking segment by Salesperson (in seconds)
    - **Buying Signals**: Specific phrases showing interest (e.g., "How soon can we start?", "What's the pricing?")
    - **Risk Signals**: Warning phrases (e.g., "We need to think about it", "Our budget is tight")

    ### 4. OBJECTION TAXONOMY
    Identify EVERY objection raised by the Prospect. Categorize each as:
    - "price" = Cost/budget concerns
    - "timing" = Not the right time, too busy
    - "authority" = Need to consult others, not the decision maker
    - "need" = Not sure they need this, questioning value
    - "competitor" = Comparing to or using a competitor
    - "other" = Doesn't fit above

    For each objection:
    - Quote the EXACT words used
    - Rate how well it was handled: "strong", "weak", or "missed"
    - If weak/missed, suggest a BETTER rebuttal (specific, not generic)

    ### 5. RISK ASSESSMENT
    Rate deal health from 1-10 (10 = very likely to close).
    
    **Scoring Guide:**
    - 9-10: Multiple buying signals, clear next steps, budget confirmed
    - 7-8: Interest shown, some objections handled well
    - 5-6: Mixed signals, unresolved concerns
    - 3-4: Multiple red flags, weak engagement
    - 1-2: Deal is likely dead, major blockers

    Provide:
    - Risk level: "low" (8-10), "medium" (5-7), "high" (3-4), "critical" (1-2)
    - 2-3 specific reasons for the score
    - Any deal-breakers identified

    ### 6. COACHING CARD
    Identify exactly 3 STRENGTHS and 3 IMPROVEMENTS.
    
    **Be SPECIFIC, not generic. Bad example: "Good rapport building". Good example: "Built trust in first 90 seconds by referencing their recent product launch."**
    
    For improvements, explain WHAT to do differently, not just what was wrong.

    ### 7. NEXT STEPS
    Provide:
    - **Primary action**: The ONE thing the salesperson MUST do next
    - **Timeline**: "Within 24 hours", "Within 3 days", "This week"
    - **Secondary actions**: 2-3 additional follow-ups
    - **Follow-up email**: Draft a 3-4 sentence email the salesperson can send immediately

    ### 8. SENTIMENT FLOW
    Track engagement throughout the call:
    - Identify 10-15 points distributed EVENLY across the duration
    - Score 0-100 (0 = disengaged/hostile, 100 = highly engaged/excited)
    - Explain WHY each score was given

    ### 9. VERDICT
    Write a ONE-LINE verdict that captures the essence of the call.
    Example: "Strong discovery but missed budget qualification — follow up with ROI case study"

    ### 10. SUMMARY
    Write a 2-sentence executive summary covering:
    - What happened in the call
    - Current deal status and recommended action

    ## OUTPUT RULES
    - Detect the audio language and output ALL text in that EXACT language
    - Be brutally honest — the salesperson needs truth, not comfort
    - Be specific — cite exact moments and quotes from the call
    - Return ONLY valid JSON matching the schema
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
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
        temperature: 0.1, // Slightly above 0 for more natural coaching language
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Call Classification
            callType: {
              type: Type.STRING,
              enum: ["discovery", "demo", "negotiation", "closing", "renewal", "other"],
              description: "Type of sales call"
            },

            // One-line Verdict
            verdict: {
              type: Type.STRING,
              description: "One-line verdict capturing the essence of the call"
            },

            // Summary
            summary: {
              type: Type.STRING,
              description: "2-sentence executive summary"
            },

            // Topics
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5-7 key topics discussed"
            },

            // Transcript
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

            // Sentiment
            sentiment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timePoint: { type: Type.STRING },
                  score: { type: Type.NUMBER, description: "0-100 engagement score" },
                  context: { type: Type.STRING, description: "Why this score was given" }
                }
              }
            },

            // Coaching
            coaching: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },

            // NEW: Sales Metrics
            salesMetrics: {
              type: Type.OBJECT,
              properties: {
                talkRatio: { type: Type.NUMBER, description: "Percentage of time salesperson talked (0-100)" },
                questionCount: { type: Type.NUMBER, description: "Number of questions asked by salesperson" },
                fillerWordCount: { type: Type.NUMBER, description: "Count of filler words (um, uh, like)" },
                longestMonologue: { type: Type.NUMBER, description: "Longest uninterrupted speaking (seconds)" },
                buyingSignals: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Specific phrases showing buying interest"
                },
                riskSignals: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Warning phrases indicating risk"
                }
              }
            },

            // NEW: Risk Assessment
            riskAssessment: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER, description: "Deal health score 1-10 (10 = likely to close)" },
                level: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                reasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Reasons for this risk score"
                },
                dealBreakers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Issues that could kill the deal"
                }
              }
            },

            // NEW: Objections
            objections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ["price", "timing", "authority", "need", "competitor", "other"]
                  },
                  quote: { type: Type.STRING, description: "Exact quote from prospect" },
                  timestamp: { type: Type.STRING },
                  rebuttalQuality: {
                    type: Type.STRING,
                    enum: ["strong", "weak", "missed"]
                  },
                  suggestedRebuttal: { type: Type.STRING, description: "Better rebuttal if weak/missed" }
                }
              }
            },

            // NEW: Next Steps
            nextSteps: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING, description: "Most important action to take" },
                timeline: { type: Type.STRING, description: "When to do it (Within 24 hours, etc.)" },
                secondary: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Additional follow-up actions"
                },
                followUpEmail: { type: Type.STRING, description: "Draft follow-up email (3-4 sentences)" }
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