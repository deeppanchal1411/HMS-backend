import express from "express";
import PublicContact from "../models/PublicContact.js";

const publicContactRoutes = express.Router();

publicContactRoutes.post("/", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMessage = new PublicContact({ name, email, message });
        await newMessage.save();

        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully!",
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

export default publicContactRoutes;