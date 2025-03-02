const express = require("express");
const app = express();
const fs = require("fs");
require("dotenv").config();
const path = require('path');

app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }));

async function getAIResponse(userInput) {
    // const data = fs.readFileSync("data.json", "utf8");
const filePath = path.join(__dirname, "data.json");

const data = fs.readFileSync(filePath, "utf8");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.AI_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "google/gemini-flash-1.5-8b",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant, but you must only answer based on the provided data. If the answer is not in the data, respond with 'Sorry, i dont get what u Mean. Can you be more Specific.'"
                },
                {
                    role: "user",
                    content: `Here is the available data:\n${data}\n\nNow answer this question: ${userInput}`
                }
            ]
        })
    });

    const result = await response.json();
    if (!result.choices || result.choices.length === 0) {
        return "Error: No response from AI";
    }
    return result.choices[0].message.content;
}

app.get('/', (req, res) => {
    res.render('index', { answer: 'Hey There!' })
})
app.post("/ask", async (req, res) => {
    const query = req.body.question;
    if (!query) {
        return res.render('index', { answer: "Please provide a query (e.g., What are You?)" });
    }
    const answer = await getAIResponse(query);
    res.render('index', { answer });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});

