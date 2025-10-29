import express from "express";
import Contact from "../models/contactModel.js";
import { authenticate } from "../middleware/authMiddleware.js";

const contactRoutes = express.Router();

contactRoutes.post("/", authenticate, async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMessage = new Contact({ subject, message });
        await newMessage.save();

        res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

export default contactRoutes;