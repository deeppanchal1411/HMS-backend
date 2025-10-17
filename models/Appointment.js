import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    doctor: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Doctor",
        required:true
    },
    patient: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Patient",
        required:true
    },
    doctorName: {
        type:String,
        required:true
    },
    department: {
        type:String,
        required:true
    },
    date: {
        type:Date,
        required:true
    },
    time: {
        type:String,
        required:true
    },
    symptoms: {
        type:String
    },
    status: {
        type:String,
        enum:["pending", "completed", "cancelled"],
        default:"pending"
    },
    notes: {
        type:String,
        default:""
    }
}, {
    timestamps:true
});

export default mongoose.model("Appointment", appointmentSchema);