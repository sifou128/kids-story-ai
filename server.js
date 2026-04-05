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
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const promptText = `You are a children's book author. Write a story based on: Name: ${childName}, Age: ${childAge}, Loves: ${interests}, Lesson: ${lesson}. Return ONLY a valid JSON array of 5 objects. Each object must have only one key: "text" (the story paragraph). IMPORTANT: The language of the story MUST perfectly match the language the user used for their inputs. If they typed in Arabic, write it in Arabic. If English, write in English. Do NOT include markdown tags like \`\`\`json, just output the raw array.`;

        const API_KEY = process.env.AI_API_KEY;
        if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
            return res.status(500).json({ error: 'API Key is not configured correctly on the server.' });
        }

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // الاتصال بخدمة الذكاء الاصطناعي لتوليد القصة
        const result = await model.generateContent(promptText);
        let generatedText = result.response.text();
        
        // استخراج مصفوفة JSON بشكل آمن حتى لو أضاف الذكاء الاصطناعي نصوصاً إضافية
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("لم يتمكن الذكاء الاصطناعي من توليد استجابة بصيغة JSON صالحة.");
        }
        const cleanJson = jsonMatch[0];
        
        const pagesArray = JSON.parse(cleanJson);

        // لا نستدعي أي صور هنا، فقط نرسل مصفوفة الصفحات النصية

        res.json({ pages: pagesArray });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'An unexpected server error occurred: ' + (error.message || 'Unknown error') });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
