import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Backward compatible params
    const { name, category, keyPoints, tone, language, apiKey } = body || {};

    // Business growth coach: analyze targets vs actuals and suggest actions
    if (body?.mode === 'growth-coach') {
      const key = body?.apiKey || process.env.OPENAI_API_KEY;
      const metrics = body?.metrics || {};
      const lang = body?.language || 'bn';

      // Build safe local fallback (works without API key)
      const buildFallback = () => {
        const monthlyTarget = Number(metrics?.monthlyTarget || 0);
        const soldToDate = Number(metrics?.soldToDate || 0);
        const remainingDays = Number(metrics?.remainingDays || 0);
        const gap = Math.max(0, monthlyTarget - soldToDate);
        const req = remainingDays > 0 ? Math.ceil(gap / remainingDays) : 0;
        const curAvg = Number(metrics?.currentAvgPerDay || 0);
        const status = curAvg >= (metrics?.requiredPerDay || 0) ? 'গ্রিন' : (curAvg >= (metrics?.requiredPerDay || 0) * 0.7 ? 'অ্যাম্বার' : 'রেড');
        const summary = `মাসিক টার্গেট ${monthlyTarget} ইউনিট, বিক্রি ${soldToDate}. বাকি ${remainingDays} দিনে প্রতিদিন ≈ ${req} ইউনিট দরকার। স্টেটাস: ${status}.`;
        const bullets = [
          `বর্তমান গতি: ${curAvg}/day বনাম প্রয়োজন: ${metrics?.requiredPerDay || 0}/day`,
          `বাকি লক্ষ্য: ${gap} ইউনিট`,
          `মাস: ${metrics?.month || ''} ${metrics?.year || ''}`
        ];
        const next = [
          'শীর্ষ ২ প্রোডাক্টে +১৫% বাজেট ও নতুন ক্রিয়েটিভ A/B টেস্ট চালু করুন',
          'আজকে ৬-৮ ঘন্টার ফ্ল্যাশ অফার (ফ্রি/ডিসকাউন্টেড ডেলিভারি) দিন',
          'রিটার্ন/ড্যামেজ কস্ট কমাতে কুরিয়ার/প্যাকেজিং অপ্টিমাইজ করুন',
          'লো কনভার্টিং প্রোডাক্টে কপি/Thumb পরিবর্তন করুন',
          'স্টক/ডেলিভারি SLA ক্লিনআপ করে কাস্টমার অভিজ্ঞতা উন্নত করুন'
        ];
        return { summary, bullets, next_actions: next };
      };

      // If no key, return local fallback instead of 400
      if (!key) {
        return NextResponse.json(buildFallback());
      }

      const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: false });

      const prompt = `তুমি একজন ই-কমার্স গ্রোথ কোচ। নিচের মেট্রিক্স দেখে সংক্ষিপ্ত বাংলা বিশ্লেষণ দাও এবং 3-6টি কর্মযোগ্য সাজেশন দাও।

সমষ্টিগত মেট্রিক্স:
- মাস: ${metrics?.month || 'N/A'} ${metrics?.year || ''}
- দিন: ${metrics?.elapsedDays || 0}/${metrics?.daysInMonth || 0}
- মাসিক টার্গেট (units): ${metrics?.monthlyTarget || 0}
- এখন পর্যন্ত সেল (units): ${metrics?.soldToDate || 0}
- বাকি দিন: ${metrics?.remainingDays || 0}
- প্রয়োজনীয় দৈনিক গতি (units/day): ${metrics?.requiredPerDay || 0}
- বর্তমান গড় গতি (units/day): ${metrics?.currentAvgPerDay || 0}
- মাসিক বাজেট (BDT): ${metrics?.monthlyBudget || 0}

প্রোডাক্ট-লেভেল (সংক্ষিপ্ত):
${Array.isArray(metrics?.products) ? metrics.products.slice(0, 10).map((p: any, i: number) => `${i+1}) ${p.name}: target(m)=${p.requiredMonthlyUnits||0}, target(d)=${p.requiredDailyUnits||0}, soldToDate=${p.soldToDate||0}`).join('\n') : 'N/A'}

উদ্দেশ্য:
1) টার্গেটের সাথে বর্তমান গতির তুলনা করে রেড/অ্যাম্বার/গ্রিন স্টেট দাও।
2) যদি অফ-ট্র্যাক হয়, বাকি দিন ধরে নতুন প্রয়োজনীয় দৈনিক টার্গেট দাও।
3) 3-6টি অ্যাকশন আইটেম দাও (প্রোডাক্ট সিলেকশন, বাজেট অ্যালোকেশন, রিটার্ন/ড্যামেজ কন্ট্রোল, কপি/ক্রিয়েটিভ A/B টেস্ট, ডিসকাউন্ট/বাম্প অফার, ডেলিভারি-চার্জ স্ট্র্যাটেজি)।
4) আউটপুট শুধুমাত্র JSON:
{"summary":"২-৩ লাইনে মূল অবস্থা","bullets":["...","..."],"next_actions":["...","..."]}`;

      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 450
        });
        const text = res.choices[0]?.message?.content?.trim() || '{}';
        let json: any = {};
        try {
          const m = text.match(/\{[\s\S]*\}/);
          json = m ? JSON.parse(m[0]) : JSON.parse(text);
        } catch {
          // Minimal fallback using provided metrics
          const gap = (metrics?.monthlyTarget || 0) - (metrics?.soldToDate || 0);
          const req = metrics?.remainingDays ? Math.ceil(Math.max(0, gap) / metrics.remainingDays) : 0;
          json = {
            summary: `এ মাসে লক্ষ্যমাত্রা ${metrics?.monthlyTarget||0} ইউনিট। এখন পর্যন্ত ${metrics?.soldToDate||0} ইউনিট বিক্রি হয়েছে। প্রতিদিন ${req} ইউনিট করেই লক্ষ্য ধরতে হবে।`,
            bullets: [
              `বর্তমান গতি: ${metrics?.currentAvgPerDay||0}/day, প্রয়োজন: ${metrics?.requiredPerDay||0}/day`,
              `বাকি দিন: ${metrics?.remainingDays||0}, বাকি টার্গেট: ${Math.max(0,gap)}`
            ],
            next_actions: [
              'শীর্ষ ২ প্রোডাক্টে বাজেট +১৫% ও নতুন ক্রিয়েটিভ A/B টেস্ট করুন',
              'রিটার্ন/ড্যামেজ কস্ট কমাতে কুরিয়ার সিলেকশন ও প্যাকেজিং অপ্টিমাইজ করুন',
              'আজকের জন্য ফ্ল্যাশ অফার (ফ্রি ডেলিভারি/বাম্প অফার) চালান'
            ]
          };
        }
        return NextResponse.json({
          summary: json.summary || '',
          bullets: Array.isArray(json.bullets) ? json.bullets : [],
          next_actions: Array.isArray(json.next_actions) ? json.next_actions : []
        });
      } catch (e) {
        console.error('growth-coach AI error:', e);
        // Fallback gracefully with heuristic output
        return NextResponse.json(buildFallback());
      }
    }

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

    // Payment instructions generation mode
    if (body?.mode === 'payment-instructions') {
      const { provider, number, accountType, language = 'bn', apiKey } = body || {};
      if (!provider || !number) {
        return NextResponse.json({ error: 'provider and number required' }, { status: 400 });
      }
      if (!apiKey) {
        return NextResponse.json({ error: "OpenAI API key required. Please add it in Settings → General." }, { status: 400 });
      }
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
      const provName = String(provider).toLowerCase();
      const flow = (String(accountType || 'Personal').toLowerCase() === 'merchant') ? 'Payment' : 'Send Money';
      const prompt = `তুমি একজন ই-কমার্স সাপোর্ট এজেন্ট। ${provName} মোবাইল ব্যাংকিং দিয়ে কিভাবে ${flow} করতে হবে তার স্টেপ-বাই-স্টেপ বাংলা নির্দেশনা দাও।

শর্ত:
- একাউন্ট নাম্বার: ${number}
- একাউন্ট টাইপ: ${accountType || 'Personal'} (টাইপ Personal হলে 'Send Money' ফ্লো, Merchant হলে 'Payment' ফ্লো ব্যবহার করো)
- ভাষা: ${language}
- ব্যবহারকারীর জন্য খুবই সহজ, নম্বর/স্টেপ ক্লিয়ারলি দাও, রেফারেন্স/নোট যুক্ত করো।

আউটপুট শুধুমাত্র JSON:
{"instructions":"1) ...\n2) ...\n3) ..."}`;
      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 300
        });
        const text = res.choices[0]?.message?.content?.trim() || '{}';
        let json: any = {};
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          json = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
        } catch {
          json = { instructions: `${provName} অ্যাপে গিয়ে ${flow} → Number: ${number} → Amount → Reference/Order ID → Submit` };
        }
        return NextResponse.json({ instructions: json.instructions });
      } catch (err) {
        console.error('AI payment-instructions error:', err);
        return NextResponse.json({ instructions: `${provName} অ্যাপে গিয়ে ${flow} → Number: ${number} → Amount → Reference/Order ID → Submit` });
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

  // Business summary: analyze profit/cost metrics and suggest actions
  if (body?.mode === 'business-summary') {
    const dbKey = await db.chatBotSetting.findFirst({ select: { openaiApiKey: true } }).catch(() => null);
    const key = body?.apiKey || process.env.OPENAI_API_KEY || dbKey?.openaiApiKey || undefined;
    const m = body?.metrics || {};

    // Historical context (last 60 days vs previous 60 days) to strengthen local analysis
    const hist = async () => {
      try {
        const now = new Date();
        const since60 = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
        const since120 = new Date(now.getTime() - 120 * 24 * 3600 * 1000);
        const last = await db.order.findMany({ where: { status: 'delivered', createdAt: { gte: since60 } } });
        const prev = await db.order.findMany({ where: { status: 'delivered', createdAt: { gte: since120, lt: since60 } } });
        const sum = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + (f(x) || 0), 0);
        const revLast = sum(last, o => o.total || 0);
        const revPrev = sum(prev, o => o.total || 0);
        const cntLast = last.length || 0;
        const cntPrev = prev.length || 0;
        const aovLast = cntLast > 0 ? revLast / cntLast : 0;
        const aovPrev = cntPrev > 0 ? revPrev / cntPrev : 0;
        const growth = revPrev > 0 ? ((revLast - revPrev) / revPrev) * 100 : (revLast > 0 ? 100 : 0);
        const aovTrend = aovPrev > 0 ? ((aovLast - aovPrev) / aovPrev) * 100 : (aovLast > 0 ? 100 : 0);
        return { revLast, revPrev, cntLast, cntPrev, aovLast, aovPrev, growth, aovTrend };
      } catch {
        return null;
      }
    };
    const histData = await hist();

    const fallback = () => {
      const revenue = Number(m.revenue || 0);
      const cogs = Number(m.cogs || 0);
      const delivery = Number(m.deliveryCost || 0);
      const others = Number(m.otherExpenses || 0);
      const returnsDamages = Number(m.returnsDamages || 0);
      const net = Number(m.netProfit || (revenue - (cogs + delivery + others + returnsDamages)));
      const pct = revenue > 0 ? (net / revenue) * 100 : 0;
      const gm = revenue - cogs;
      const gmPct = revenue > 0 ? (gm / revenue) * 100 : 0;
      const deliveryPct = revenue > 0 ? (delivery / revenue) * 100 : 0;
      const returnsPct = revenue > 0 ? (returnsDamages / revenue) * 100 : 0;
      const othersPct = revenue > 0 ? (others / revenue) * 100 : 0;

      const trendTxt = histData ? ` | ট্রেন্ড (৬০ দিনে): রেভিনিউ ${histData.growth.toFixed(1)}%, AOV ${histData.aovTrend.toFixed(1)}%` : '';
      const summary = `এই মাসে রেভিনিউ ${revenue.toFixed(0)}, গ্রস মার্জিন ${gm.toFixed(0)} (${gmPct.toFixed(1)}%), নেট ${net.toFixed(0)} (${pct.toFixed(1)}%). কস্ট ব্রেকডাউন: ডেলিভারি ${delivery.toFixed(0)} (${deliveryPct.toFixed(1)}%), রিটার্ন/ড্যামেজ ${returnsDamages.toFixed(0)} (${returnsPct.toFixed(1)}%), অন্যান্য ${others.toFixed(0)} (${othersPct.toFixed(1)}%).${trendTxt}`;

      const bullets: string[] = [];
      if (gmPct < 30) bullets.push('গ্রস মার্জিন কম — কেনাকাটা মূল্য/প্রাইসিং পুনর্বিবেচনা করুন (টার্গেট ≥ 35-40%)');
      if (deliveryPct > 10) bullets.push('ডেলিভারি কস্ট বেশি — কুরিয়ার রেট নেগোশিয়েট/এরিয়া-ভিত্তিক চার্জিং ব্যবহার করুন');
      if (returnsPct > 5) bullets.push('রিটার্ন/ড্যামেজ বেশি — কপি/ছবি/সাইজ-গাইড/QA উন্নত করুন, প্যাকেজিং শক্ত করুন');
      if (othersPct > 8) bullets.push('অন্যান্য খরচ বেশি — কম ROI ক্যাম্পেইন pause ও অপেক্স রিভিউ করুন');
      if (histData) {
        if (histData.growth < 0) bullets.push('সাম্প্রতিক রেভিনিউ ডাউন্ট্রেন্ড — টপ-ফানেল বাজেট ও রিমার্কেটিং বাড়ান');
        if (histData.aovTrend < 0) bullets.push('AOV কমছে — বান্ডল/বাম্প অফার, ফ্রি শিপ থ্রেশহোল্ড বাড়ান');
      }
      if (bullets.length === 0) bullets.push('মোটামুটি স্বাস্থ্যকর — উচ্চ কনভার্টিং প্রোডাক্টে বাজেট স্কেল করুন');

      const next = [
        'শীর্ষ ২-৩ প্রোডাক্টে +১৫% বাজেট ও নতুন ক্রিয়েটিভ A/B টেস্ট চালু করুন',
        'বাম্প অফার/বান্ডল দিয়ে AOV বাড়ান (যেমন: ফ্রি ডেলিভারি থ্রেশহোল্ড)',
        'রিটার্ন কমাতে PDP-তে USP/সাইজ-গাইড ও বাস্তব ছবি যোগ করুন',
        'কুরিয়ার SLA রিভিউ ও জোনভিত্তিক ডেলিভারি চার্জ অপ্টিমাইজ করুন',
        'লো মার্জিন SKU-তে ন্যূনতম প্রফিট থ্রেশহোল্ড সেট করুন'
      ];
      return { summary, bullets, next_actions: next, percent: Number(pct.toFixed(1)) };
    };

    if (!key) {
      return NextResponse.json(fallback());
    }

    const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: false });
    const prompt = `তুমি একজন সিএফও/গ্রোথ কোচ। নিচের বিজনেস মেট্রিক্স দেখে বাংলায় সংক্ষিপ্ত বিশ্লেষণ ও কর্মযোগ্য সুপারিশ (৩-৬টি) দাও।

মেট্রিক্স:
- Revenue: ${m.revenue}
- COGS: ${m.cogs}
- Delivery: ${m.deliveryCost}
- Other Expenses: ${m.otherExpenses}
- Returns/Damages: ${m.returnsDamages}
- Net Profit: ${m.netProfit}
- Net Profit %: ${m.netProfitPct}

আউটপুট কেবল JSON:
{"summary":"২-৪ লাইনে কি হচ্ছে","bullets":["key insight 1","key insight 2"],"next_actions":["action 1","action 2"],"percent":NUMBER}`;

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 400
      });
      const text = res.choices[0]?.message?.content?.trim() || '{}';
      let json: any = {};
      try {
        const m = text.match(/\{[\s\S]*\}/);
        json = m ? JSON.parse(m[0]) : JSON.parse(text);
      } catch {
        json = fallback();
      }
      const fb = fallback();
      return NextResponse.json({
        summary: json.summary || fb.summary,
        bullets: Array.isArray(json.bullets) && json.bullets.length ? json.bullets : fb.bullets,
        next_actions: Array.isArray(json.next_actions) && json.next_actions.length ? json.next_actions : fb.next_actions,
        percent: typeof json.percent === 'number' ? json.percent : fb.percent
      });
    } catch (e) {
      console.error('business-summary AI error:', e);
      return NextResponse.json(fallback());
    }
  }
}
