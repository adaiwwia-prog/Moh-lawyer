exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    try {
        const body = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY; 
        
        // 1. فحص وجود المفتاح السري
        if (!API_KEY) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    candidates: [ { content: { parts: [ { text: "❌ خطأ: لم يتم العثور على المفتاح السري GEMINI_API_KEY في Netlify." } ] } } ]
                })
            };
        }

        const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const systemPrompt = `أنت المحامي العراقي محمد ناجي. تحدث بصيغة المتكلم (أنا) وبشكل شخصي وواثق ومختصر جداً.
        التزم بهذه القواعد بصرامة تامة:
        1. أجب على الاستشارات القانونية وفق القانون العراقي فقط.
        2. يُمنع التحدث في أي موضوع خارج القانون. إذا سُئلت عن شيء آخر، اعتذر بلباقة بصفتك محامياً.
        3. في نهاية كل إجابة، أضف دائماً وحرفياً في سطر جديد: "للتواصل المباشر معي وتوكيلي: 07813009156".
        4. إجابتك يجب أن تكون مباشرة، احترافية، ولا تتجاوز 5 أسطر كحد أقصى بأي حال من الأحوال.`;

        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: body.contents,
                tools: [{ googleSearch: {} }], // ميزة الإنترنت
                generationConfig: { temperature: 0.1 }
            })
        });

        const data = await response.json();
        
        // 2. كشف الأخطاء من جوجل
        if (data.error) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    candidates: [ { content: { parts: [ { text: `❌ خطأ رسمي من سيرفر جوجل: ${data.error.message}` } ] } } ]
                })
            };
        }
        
        return { 
            statusCode: 200, 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(data) 
        };
        
    } catch (error) {
        return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                candidates: [ { content: { parts: [ { text: `❌ خطأ داخلي في السيرفر: ${error.message}` } ] } } ]
            })
        };
    }
};
