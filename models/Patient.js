import mongoose from "mongoose";

// Defining the patient schema
const patientSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true
    },
    dob: {
        type:Date,
        required:true
    },
    gender: {
        type:String,
        enum:['male', 'female'],
        required:true
    },
    phone: {
        type:String,
        required:true,
        unique:true
    },
    password: {
        type:String,
        required:true
    },
}, {
    timestamps:true
});

export default mongoose.model('Patient', patientSchema);