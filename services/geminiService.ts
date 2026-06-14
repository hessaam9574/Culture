
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuestionnaireData, AnalysisResult, RawSubmission, AnalysisChartData, Recommendation } from "../types";

const parseJSON = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("فرمت پاسخ هوش مصنوعی نامعتبر است.");
  }
};

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("کلید API یافت نشد.");
    }
    return new GoogleGenAI({ apiKey });
}

const calculateQuantitativeMetrics = (data: QuestionnaireData): { healthScore: number, chartData: AnalysisChartData[] } => {
  let score = 65; 
  score += data.positiveTraits.length * 4;
  score -= data.challenges.length * 5;
  score += data.assumptionsSelection.length * 1.5;

  const dimensions = [
    { name: 'انضباط معنوی', weight: data.artifactsSelection.filter(s => s.includes('نظم') || s.includes('منضبط')).length * 18 + (data.positiveTraits.includes('نظم و انضباط مثال‌زدنی') ? 35 : 0) },
    { name: 'اقتدار قانونی', weight: data.assumptionsSelection.filter(s => s.includes('اقتدار')).length * 20 + (data.positiveTraits.includes('اقتدار و قاطعیت در برخورد با مجرمان') ? 30 : 0) },
    { name: 'وفاداری و ایثار', weight: data.assumptionsSelection.filter(s => s.includes('وفاداری')).length * 25 + (data.positiveTraits.includes('روحیه ایثار و از خودگذشتگی') ? 25 : 0) },
    { name: 'عدالت‌محوری', weight: data.valuesSelection.length * 10 },
    { name: 'تاب‌آوری عملیاتی', weight: 100 - (data.challenges.length * 12) },
  ];

  const chartData = dimensions.map(d => ({
    subject: d.name,
    A: Math.max(15, Math.min(100, 15 + d.weight)),
    fullMark: 100
  }));

  return { healthScore: Math.min(100, Math.max(5, score)), chartData };
};

export const aggregateSubmissions = (submissions: RawSubmission[]): QuestionnaireData => {
  if (submissions.length === 0) throw new Error("داده‌ای انتخاب نشده است.");
  
  return {
    assumptionsSelection: Array.from(new Set(submissions.flatMap(s => s.assumptionsSelection))),
    assumptionsText: submissions.map(s => `[${s.userName} - ${s.userJobTitle}]: ${s.assumptionsText}`).join('\n\n'),
    valuesSelection: Array.from(new Set(submissions.flatMap(s => s.valuesSelection))),
    valuesText: submissions.map(s => `[${s.userName} - ${s.userJobTitle}]: ${s.valuesText}`).join('\n\n'),
    artifactsSelection: Array.from(new Set(submissions.flatMap(s => s.artifactsSelection))),
    artifactsText: submissions.map(s => `[${s.userName} - ${s.userJobTitle}]: ${s.artifactsText}`).join('\n\n'),
    positiveTraits: Array.from(new Set(submissions.flatMap(s => s.positiveTraits))),
    challenges: Array.from(new Set(submissions.flatMap(s => s.challenges))),
  };
};

export const convertTextToQuestionnaireData = async (rawText: string): Promise<QuestionnaireData> => {
    const ai = getAiInstance();
    const prompt = `متن زیر را بر اساس مدل شاین (Edgar Schein) با تمرکز بر مفاهیم انتظامی و پلیسی تحلیل کرده و به خروجی JSON تبدیل کن. حتماً اصطلاحات انتظامی ایران را مد نظر قرار بده:\n${rawText}`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            assumptionsSelection: { type: Type.ARRAY, items: { type: Type.STRING } },
            assumptionsText: { type: Type.STRING },
            valuesSelection: { type: Type.ARRAY, items: { type: Type.STRING } },
            valuesText: { type: Type.STRING },
            artifactsSelection: { type: Type.ARRAY, items: { type: Type.STRING } },
            artifactsText: { type: Type.STRING },
            positiveTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
            challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["assumptionsSelection", "assumptionsText", "valuesSelection", "valuesText", "artifactsSelection", "artifactsText", "positiveTraits", "challenges"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema }
    });
    return parseJSON(response.text);
};

export const analyzeCultureText = async (data: QuestionnaireData, focus: string[], sensitivity: string): Promise<AnalysisResult> => {
  const ai = getAiInstance();
  const { healthScore, chartData } = calculateQuantitativeMetrics(data);

  const prompt = `
    به عنوان یک تحلیل‌گر ارشد سازمان‌های نظامی و انتظامی، تحلیل جامع و بسیار عمیق فرهنگ سازمانی فرماندهی انتظامی ایران را بر اساس مدل ادگار شاین ارائه بده.
    
    داده‌های ورودی:
    1. مصنوعات و نمادها: (${data.artifactsSelection.join('، ')}) | تشریحی: ${data.artifactsText}
    2. ارزش‌های ابرازی: (${data.valuesSelection.join('، ')}) | تشریحی: ${data.valuesText}
    3. مفروضات بنیادین (لایه‌ی پنهان): (${data.assumptionsSelection.join('، ')}) | تشریحی: ${data.assumptionsText}
    4. نقاط قوت: ${data.positiveTraits.join('، ')}
    5. چالش‌های شناسایی شده: ${data.challenges.join('، ')}
    
    الزامات تحلیل:
    - تحلیل هر لایه باید حداقل ۳ پاراگراف طولانی و موشکافانه باشد.
    - در لایه مصنوعات، به جنبه‌های کالبدی، بصری و رفتاری در کلانتری‌ها و واحدها بپرداز.
    - در لایه ارزش‌ها، شکاف بین شعارهای رسمی و واقعیت‌های عملیاتی را نقد کن.
    - در لایه مفروضات، ریشه‌های وفاداری، ترس، یا ایثار در بین پرسنل را تحلیل کن.
    - از اصطلاحات تخصصی مثل "انضباط معنوی"، "اقتدار نرم"، "کرامت انسانی" و "سرمایه اجتماعی پلیس" استفاده کن.
    
    رویکرد تحلیل: ${sensitivity === 'low' ? 'خوش‌بینانه و تقویت‌کننده' : sensitivity === 'high' ? 'منتقدانه و آسیب‌شناسانه' : 'واقع‌بینانه و متعادل'}.
    تمرکز بر لایه‌های: ${focus.map(f => f === 'artifacts' ? 'مصنوعات' : f === 'values' ? 'ارزش‌ها' : 'مفروضات').join(' و ')}.
    پاسخ حتماً به صورت فارسی و در قالب JSON باشد.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      cultureType: { type: Type.STRING },
      summary: { type: Type.STRING },
      culturalStatement: { type: Type.STRING },
      sentiment: { type: Type.STRING },
      artifactsAnalysis: { type: Type.STRING, description: "تحلیل عمیق و چندپاراگرافی لایه مصنوعات انتظامی" },
      valuesAnalysis: { type: Type.STRING, description: "تحلیل عمیق و چندپاراگرافی لایه ارزش‌های اخلاقی و سازمانی" },
      assumptionsAnalysis: { type: Type.STRING, description: "تحلیل عمیق و چندپاراگرافی لایه مفروضات زیربنایی و نانوشته" },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            priority: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["text", "priority", "category"]
        }
      }
    },
    required: ["cultureType", "summary", "culturalStatement", "sentiment", "artifactsAnalysis", "valuesAnalysis", "assumptionsAnalysis", "recommendations"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema }
  });

  return { ...parseJSON(response.text), healthScore, chartData };
};

export const generateCultureAvatar = async (cultureType: string, sentiment: string): Promise<string | undefined> => {
    const ai = getAiInstance();
    const prompt = `Highly detailed 3D professional conceptual art for Iranian police culture archetype: "${cultureType}". Military aesthetics, green and navy colors, professional symbols of authority and service, clear background, cinematic lighting.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts: [{ text: prompt }] },
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
    } catch (e) { return undefined; }
};

export const askAiAssistant = async (message: string, context?: string) => {
    const ai = getAiInstance();
    const systemInstruction = `شما مشاور ارشد فرماندهی انتظامی در حوزه تحلیل فرهنگ سازمانی و سرمایه اجتماعی هستید. بر اساس اطلاعات موجود (context: ${context}) به سوالات پاسخ دهید.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: message,
            config: { systemInstruction, tools: [{ googleSearch: {} }] }
        });
        const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return {
            text: response.text,
            links: grounding.map((c: any) => c.web).filter(Boolean) as { uri: string; title: string }[]
        };
    } catch (error) {
        return { text: "متأسفانه در حال حاضر امکان پاسخگویی وجود ندارد.", links: [] };
    }
};
