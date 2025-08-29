import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Backward compatible params
    const { name, category, keyPoints, tone, language, apiKey } = body || {};

    // New mode for landing header
    if (body?.mode === 'landing-header') {
      if (!apiKey) {
        return NextResponse.json({ error: "OpenAI API key required. Please add it in Settings → General." }, { status: 400 });
      }
      if (!body?.product?.name) {
        return NextResponse.json({ error: 'product.name required' }, { status: 400 });
      }
      
      console.log('🚀 AI API called for landing-header:', { productName: body.product.name });
      
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
      const prompt = `তুমি একজন কপিরাইটার। প্রোডাক্টের তথ্য দেখে ১টি আকর্ষণীয় Title (৬-১০ শব্দ) এবং ১টি Subtitle (১২-২০ শব্দ) লেখো।

প্রোডাক্ট: ${body.product.name}
ছবির রেফারেন্স: ${body.product.image || 'N/A'}

আউটপুট শুধুমাত্র JSON format-এ দিতে হবে:
{"title": "এখানে টাইটেল লিখো", "subtitle": "এখানে সাবটাইটেল লিখো"}`;
      
      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 200
        });
        
        const text = res.choices[0]?.message?.content?.trim() || '{}';
        console.log('📝 OpenAI raw response:', text);
        
        // Try to extract JSON from the response
        let json: any = {};
        try {
          // Find JSON-like content in the response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            json = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: try to parse the entire response
            json = JSON.parse(text);
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          // Fallback: create a simple title and subtitle
          json = {
            title: `${body.product.name} - নতুন অভিজ্ঞতা`,
            subtitle: `${body.product.name} এর সাথে আপনার ডিজিটাল জীবনকে আরও উন্নত করুন`
          };
        }
        
        console.log('✅ Parsed JSON:', json);
        
        const result = {
          title: json.title || `${body.product.name} - নতুন অভিজ্ঞতা`,
          subtitle: json.subtitle || `${body.product.name} এর সাথে আপনার ডিজিটাল জীবনকে আরও উন্নত করুন`
        };
        
        console.log('🎯 Final result:', result);
        return NextResponse.json(result);
        
      } catch (openaiError) {
        console.error('💥 OpenAI API error:', openaiError);
        // Fallback response
        return NextResponse.json({
          title: `${body.product.name} - নতুন অভিজ্ঞতা`,
          subtitle: `${body.product.name} এর সাথে আপনার ডিজিটাল জীবনকে আরও উন্নত করুন`
        });
      }
    }

    // Product description generation mode
    if (body?.mode === 'product-description') {
      if (!apiKey) {
        return NextResponse.json({ error: "OpenAI API key required. Please add it in Settings → General." }, { status: 400 });
      }
      if (!body?.product?.name) {
        return NextResponse.json({ error: 'product.name required' }, { status: 400 });
      }
      
      console.log('🚀 AI API called for product-description:', { productName: body.product.name });
      
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
      const prompt = `তুমি একজন মার্কেটিং বিশেষজ্ঞ। প্রোডাক্টের নাম দেখে কেন কেউ এই প্রোডাক্ট কিনবে তার ১০টি আকর্ষণীয় কারণ উল্লেখ করো।

প্রোডাক্ট: ${body.product.name}

আউটপুট শুধুমাত্র JSON format-এ দিতে হবে:
{"description": "1. [প্রথম আকর্ষণীয় কারণ]\n2. [দ্বিতীয় আকর্ষণীয় কারণ]\n3. [তৃতীয় আকর্ষণীয় কারণ]\n4. [চতুর্থ আকর্ষণীয় কারণ]\n5. [পঞ্চম আকর্ষণীয় কারণ]\n6. [ষষ্ঠ আকর্ষণীয় কারণ]\n7. [সপ্তম আকর্ষণীয় কারণ]\n8. [অষ্টম আকর্ষণীয় কারণ]\n9. [নবম আকর্ষণীয় কারণ]\n10. [দশম আকর্ষণীয় কারণ]"}

প্রতিটি কারণ যেন সুবিধা, বৈশিষ্ট্য এবং মূল্য প্রস্তাবের উপর ফোকাস করে। প্রতিটি কারণ আকর্ষণীয় এবং প্রোডাক্টের জন্য নির্দিষ্ট হোক।`;
      
      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        });
        
        const text = res.choices[0]?.message?.content?.trim() || '{}';
        console.log('📝 OpenAI raw response:', text);
        
        // Try to extract JSON from the response
        let json: any = {};
        try {
          // Find JSON-like content in the response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            json = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: try to parse the entire response
            json = JSON.parse(text);
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          // Fallback: create a simple description
          json = {
            description: `1. ${body.product.name} এর অসাধারণ গুণমান\n2. প্রতিযোগিতামূলক মূল্যে সেরা মান\n3. দ্রুত ডেলিভারি সার্ভিস\n4. ২৪/৭ কাস্টমার সাপোর্ট\n5. ওয়ারেন্টি গ্যারান্টি\n6. ব্যবহারে সহজ এবং সুবিধাজনক\n7. আধুনিক প্রযুক্তি ব্যবহার\n8. পরিবেশবান্ধব উপকরণ\n9. বহুমুখী ব্যবহারযোগ্যতা\n10. সন্তুষ্টি গ্যারান্টি`
          };
        }
        
        console.log('✅ Parsed JSON:', json);
        
        const result = {
          description: json.description || `1. ${body.product.name} এর অসাধারণ গুণমান\n2. প্রতিযোগিতামূলক মূল্যে সেরা মান\n3. দ্রুত ডেলিভারি সার্ভিস\n4. ২৪/৭ কাস্টমার সাপোর্ট\n5. ওয়ারেন্টি গ্যারান্টি\n6. ব্যবহারে সহজ এবং সুবিধাজনক\n7. আধুনিক প্রযুক্তি ব্যবহার\n8. পরিবেশবান্ধব উপকরণ\n9. বহুমুখী ব্যবহারযোগ্যতা\n10. সন্তুষ্টি গ্যারান্টি`
        };
        
        console.log('🎯 Final result:', result);
        return NextResponse.json(result);
        
      } catch (openaiError) {
        console.error('💥 OpenAI API error:', openaiError);
        // Fallback response
        return NextResponse.json({
          description: `1. ${body.product.name} এর অসাধারণ গুণমান\n2. প্রতিযোগিতামূলক মূল্যে সেরা মান\n3. দ্রুত ডেলিভারি সার্ভিস\n4. ২৪/৭ কাস্টমার সাপোর্ট\n5. ওয়ারেন্টি গ্যারান্টি\n6. ব্যবহারে সহজ এবং সুবিধাজনক\n7. আধুনিক প্রযুক্তি ব্যবহার\n8. পরিবেশবান্ধব উপকরণ\n9. বহুমুখী ব্যবহারযোগ্যতা\n10. সন্তুষ্টি গ্যারান্টি`
        });
      }
    }

    // Product features generation mode
    if (body?.mode === 'product-features') {
      if (!apiKey) {
        return NextResponse.json({ error: "OpenAI API key required. Please add it in Settings → General." }, { status: 400 });
      }
      if (!body?.product?.name) {
        return NextResponse.json({ error: 'product.name required' }, { status: 400 });
      }
      
      console.log('🚀 AI API called for product-features:', { productName: body.product.name });
      
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
      const prompt = `তুমি একজন প্রোডাক্ট বিশেষজ্ঞ। প্রোডাক্টের নাম দেখে এই প্রোডাক্টের ৬টি মূল বৈশিষ্ট্য উল্লেখ করো।

প্রোডাক্ট: ${body.product.name}

আউটপুট শুধুমাত্র JSON format-এ দিতে হবে:
{"features": "1. [প্রথম বৈশিষ্ট্য]\n2. [দ্বিতীয় বৈশিষ্ট্য]\n3. [তৃতীয় বৈশিষ্ট্য]\n4. [চতুর্থ বৈশিষ্ট্য]\n5. [পঞ্চম বৈশিষ্ট্য]\n6. [ষষ্ঠ বৈশিষ্ট্য]"}

প্রতিটি বৈশিষ্ট্য সংক্ষিপ্ত কিন্তু আকর্ষণীয় হতে হবে।`;
      
      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 300
        });
        
        const text = res.choices[0]?.message?.content?.trim() || '{}';
        console.log('📝 OpenAI raw response:', text);
        
        // Try to extract JSON from the response
        let json: any = {};
        try {
          // Find JSON-like content in the response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            json = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: try to parse the entire response
            json = JSON.parse(text);
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          // Fallback: create simple features
          json = {
            features: `1. উচ্চ মানের উপকরণ\n2. দীর্ঘস্থায়ী ব্যবহার\n3. ব্যবহারে সহজ\n4. আকর্ষণীয় ডিজাইন\n5. প্রতিযোগিতামূলক মূল্য\n6. বিশ্বস্ত ব্র্যান্ড`
          };
        }
        
        console.log('✅ Parsed JSON:', json);
        
        const result = {
          features: json.features || `1. উচ্চ মানের উপকরণ\n2. দীর্ঘস্থায়ী ব্যবহার\n3. ব্যবহারে সহজ\n4. আকর্ষণীয় ডিজাইন\n5. প্রতিযোগিতামূলক মূল্য\n6. বিশ্বস্ত ব্র্যান্ড`
        };
        
        console.log('🎯 Final result:', result);
        return NextResponse.json(result);
        
      } catch (openaiError) {
        console.error('💥 OpenAI API error:', openaiError);
        // Fallback response
        return NextResponse.json({
          features: `1. উচ্চ মানের উপকরণ\n2. দীর্ঘস্থায়ী ব্যবহার\n3. ব্যবহারে সহজ\n4. আকর্ষণীয় ডিজাইন\n5. প্রতিযোগিতামূলক মূল্য\n6. বিশ্বস্ত ব্র্যান্ড`
        });
      }
    }

    // Legacy description generation
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: "OpenAI API key required. Please add it in Settings → General." 
      }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });

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
      return NextResponse.json({ error: "Failed to generate description. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ description });
  } catch (error) {
    console.error('AI API Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request format. Please check your input." }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: "Invalid OpenAI API key. Please check your configuration." }, { status: 401 });
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
      }
      if (error.message.includes('quota')) {
        return NextResponse.json({ error: "OpenAI quota exceeded. Please check your account." }, { status: 429 });
      }
    }
    return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 });
  }
}
