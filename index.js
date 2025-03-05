const express = require("express");
const app = express();
const fs = require("fs").promises; // Use promises API for file reading
require("dotenv").config();
const mongoose = require('mongoose');
const path = require('path');

app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const connectionString = process.env.DBCONNECTION;
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.log('Error connecting to MongoDB Atlas:', err));

// Define Schema and Model outside routes
const dataSchema = new mongoose.Schema({
    content: mongoose.Schema.Types.Mixed,
});

const DataModel = mongoose.model('Data', dataSchema);

async function getAIResponse(userInput) {
    try {
        const data = await DataModel.findOne();

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
    } catch (err) {
        console.error('Error retrieving data:', err);
        res.status(500).send('Error retrieving data');
    }
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

app.get('/save', async (req, res) => {
    try {
        // Read the data.json file
        const data = await fs.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(data);

        // Save the parsed JSON data to MongoDB
        const dataDocument = new DataModel({ content: jsonData });
        await dataDocument.save();
        console.log('Data saved to MongoDB');
        res.send('Data saved successfully');
    } catch (err) {
        console.error('Error reading or saving data:', err);
        res.status(500).send('Error saving data');
    }
});


app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});
