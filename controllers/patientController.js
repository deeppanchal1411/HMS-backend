import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import jwt from "jsonwebtoken";

// Registers new patient
export const registerPatient = async (req, res) => {
    const { name, email, dob, gender, phone, password } = req.body;

    try {
        // Checks if patient already exist
        const existing = await Patient.findOne({ phone });
        if (existing) {
            return res.status(400).json({ message: "Phone already registered" });
        }

        // Hashes the password
        const hashedPassword = await bcrypt.hash(password, 10);  // 10 is a salt value

        // Create new patient
        const newPatient = new Patient({
            name,
            email,
            dob,
            gender,
            phone,
            password: hashedPassword
        });

        // Saves the new patient
        await newPatient.save();
        res.status(201).json({ message: "Patient registered successfully!" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
};


// Login for existing patient
export const loginPatient = async (req, res) => {
    const { phone, password } = req.body;

    try {
        // Checks if the user exist
        const patient = await Patient.findOne({ phone });
        if (!patient) {
            return res.status(400).json({ message: "Patient not found" });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate jwt token
        const token = jwt.sign(
            { id: patient._id },  // payload
            process.env.JWT_SECRET,  // secret
            { expiresIn: '2h' }  // options
        );

        // Send response to frontend
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


// Gets a profile of loggedIn patient
export const getPatientProfile = async (req, res) => {
    try {
        // Finds the patient by ID and selects all data except password
        const patient = await Patient.findById(req.loggedInUser.id);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Sends the data of the patient to frontend
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


// Edit patient's profile
export const updatePatientProfile = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;

        // Finds the patient and update profile by ID
        const updatedPatient = await Patient.findByIdAndUpdate(
            patientId,  // patient's ID
            req.body,  // Updates the fields
            { new: true, runValidators: true }  // Updates with the new profile and checks the validation
        ).select("-password");

        if (!updatedPatient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Sends the updated response to frontend
        res.status(200).json({
            message: "Profile updated successfully",
            patient: updatedPatient
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Update patient password
export const updatePatientPassword = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const { oldPassword, newPassword } = req.body;

        // Checks if both fields are empty
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Both fields are required." });
        }

        // Finds patient by ID
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Matches the password
        const isMatch = await bcrypt.compare(oldPassword, patient.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Old password is incorrect" });
        }

        // Hashes the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);  // 10 is a salt value

        // Sets the new password as a patient's password
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