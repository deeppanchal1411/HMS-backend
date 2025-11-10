import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient", 
        required: false
    },
    subject: { type: String, required: false },
    message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);