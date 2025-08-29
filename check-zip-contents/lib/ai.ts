import OpenAI from "openai";

export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY!,
  dangerouslyAllowBrowser: false
});

export async function generateDescription({
  name, category, keyPoints, tone = "concise", language = "bn"
}: { name: string; category?: string; keyPoints?: string[]; tone?: string; language?: "bn"|"en" }) {
  try {
    const prompt = `
তুমি একজন ই-কমার্স কপিরাইটার। নিচের প্রোডাক্টের জন্য বাংলায় SEO-ফ্রেন্ডলি, 80-120 শব্দের বর্ণনা লেখো।
- নাম: ${name}
- ক্যাটাগরি: ${category ?? "General"}
- Key points: ${keyPoints?.join(", ") ?? "N/A"}
- টোন: ${tone}
- Avoid medical/false claims. Keep scannable.
আউটপুট: একটি অনুচ্ছেদ, শেষে 3-5টি bullet key features।
    `;
    
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });
    
    const description = res.choices[0]?.message?.content?.trim();
    
    if (!description) {
      throw new Error("No description generated");
    }
    
    return description;
    
  } catch (error) {
    console.error('OpenAI Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error("Invalid OpenAI API key");
      }
      if (error.message.includes('rate limit')) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (error.message.includes('quota')) {
        throw new Error("OpenAI quota exceeded. Please check your account.");
      }
    }
    
    throw new Error("Failed to generate description. Please try again.");
  }
}
