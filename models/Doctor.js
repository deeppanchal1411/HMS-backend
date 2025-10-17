import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    phone: {
        type:String,
        required:true,
        unique:true
    },
    specialization: {
        type:String,
        required:true
    },
    experience: {
        type:Number,
        required:true
    },
    gender: {
        type:String,
        enum:["male", "female"],
        required:true
    },
    password: {
        type:String,
        required:true
    },
    image: {
        type:String
    },
    role: {
        type:String,
        default:"doctor"
    }
}, {
    timestamps:true
});

// Hash password before saving
doctorSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

export default mongoose.model("Doctor", doctorSchema);