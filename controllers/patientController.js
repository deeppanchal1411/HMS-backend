import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import jwt from "jsonwebtoken";

export const registerPatient = async (req, res) => {
    const { name, email, dob, gender, phone, password } = req.body;

    try {
        const existing = await Patient.findOne({ phone });
        if (existing) {
            return res.status(400).json({ message: "Phone already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        const newPatient = new Patient({
            name,
            email,
            dob,
            gender,
            phone,
            password: hashedPassword
        });

        await newPatient.save();
        res.status(201).json({ message: "Patient registered successfully!" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
};


export const loginPatient = async (req, res) => {
    const { phone, password } = req.body;

    try {
        const patient = await Patient.findOne({ phone });
        if (!patient) {
            return res.status(400).json({ message: "Patient not found" });
        }

        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: patient._id },  
            process.env.JWT_SECRET,  
            { expiresIn: '2h' }  
        );

        res.status(200).json({
            message: "Login successful",
            token,
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                dob: patient.dob,
                gender: patient.gender
            }
        });

    } catch (err) {
        console.log("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findById(req.loggedInUser.id);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json({
            id: patient._id,
            email: patient.email,
            name: patient.name,
            dob: patient.dob,
            gender: patient.gender,
            phone: patient.phone,
        });

    } catch (err) {
        console.log("Error fetching profile:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const updatePatientProfile = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;

        const updatedPatient = await Patient.findByIdAndUpdate(
            patientId,  
            req.body,  
            { new: true, runValidators: true }  
        ).select("-password");

        if (!updatedPatient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            patient: updatedPatient
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updatePatientPassword = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Both fields are required." });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, patient.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Old password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);  

        patient.password = hashedPassword;
        await patient.save();

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getDoctorsForPatient = async (req, res) => {
    try {
        const doctors = await Doctor.find({}, "name specialization");
        res.json(doctors);

    } catch (err) {
        console.error("Error fetching doctors:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};