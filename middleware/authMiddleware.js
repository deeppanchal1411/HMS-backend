import jwt from "jsonwebtoken";

const authenticate = async (req, res, next) => {

    // Read the token from the request header
    const token = req.header("Authorization")?.split(" ")[1];  // Takes the index[1] 

    // Checks if the token is there or not
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        // Verifies the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attch user id to request
        req.loggedInUser = decoded;
        next();

    } catch (err) {
        console.log("Jwt verification failed", err);
        res.status(401).json({ error: "Invalid token" });
    }
};

// Middleware for admin
const isAdmin = (req, res, next) => {
    if (req.loggedInUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
};
 
export { authenticate, isAdmin };