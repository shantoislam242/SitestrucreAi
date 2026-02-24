import { GoogleGenAI, Type } from "@google/genai";
import { WebsiteStructure, AnalysisOptions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeBusinessContent(rawText: string, options: AnalysisOptions = {}): Promise<WebsiteStructure> {
  const sectionsPrompt = options.requestedSections && options.requestedSections.length > 0 
    ? `Focus specifically on generating these sections: ${options.requestedSections.join(", ")}.`
    : `Identify key sections like Hero, Features, About, Testimonials, Pricing, and CTA.`;

  const contentSource = options.pdfText 
    ? `Primary Content (from PDF): ${options.pdfText}\n\nAdditional Context: ${rawText}`
    : rawText;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following business description and break it down into a structured website framework. 
    ${sectionsPrompt}
    For each section, provide the content, key points, and a layout suggestion (e.g., "Split layout with image on right", "3-column grid", "Centered text").
    
    Business Description:
    ${contentSource}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          businessName: { type: Type.STRING },
          tagline: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                layoutSuggestion: { type: Type.STRING },
                visualCues: { type: Type.STRING }
              },
              required: ["type", "title", "content", "keyPoints", "layoutSuggestion"]
            }
          }
        },
        required: ["businessName", "tagline", "sections"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as WebsiteStructure;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to analyze content. Please try again.");
  }
}
