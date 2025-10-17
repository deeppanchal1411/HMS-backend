import express from "express";
import Contact from "../models/contactModel.js";

const contactRoutes = express.Router();

contactRoutes.post("/", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMessage = new Contact({ name, email, message });
        await newMessage.save();

        res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

export default contactRoutes;