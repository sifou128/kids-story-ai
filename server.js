const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
dotenv.config();

const app = express();
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/generate-story', async (req, res) => {
    try {
        const { childName, childAge, interests, lesson } = req.body;

        if (!childName || !childAge || !interests || !lesson) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة.' });
        }

        const promptText = `You are a children's book author. Write a story based on: Name: ${childName}, Age: ${childAge}, Loves: ${interests}, Lesson: ${lesson}. Return ONLY a valid JSON array of 5 objects. Each object must have only one key: "text" (the story paragraph in simple Arabic). Do NOT include markdown tags like \`\`\`json, just output the raw array.`;

        const API_KEY = process.env.AI_API_KEY;
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            return res.status(500).json({ error: 'لم يتم إعداد مفتاح API بشكل صحيح في السيرفر.' });
        }

        // تهيئة عميل Gemini API
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // الاتصال بخدمة الذكاء الاصطناعي لتوليد القصة
        const result = await model.generateContent(promptText);
        let generatedText = result.response.text();
        
        // إذا قام الذكاء الاصطناعي بوضع علامات الـ Markdown حول کود JSON، نقوم بحذفها
        if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (generatedText.startsWith('```')) {
            generatedText = generatedText.replace(/```/g, '').trim();
        }
        
        const pagesArray = JSON.parse(generatedText);

        // لا نستدعي أي صور هنا، فقط نرسل مصفوفة الصفحات النصية

        res.json({ pages: pagesArray });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
