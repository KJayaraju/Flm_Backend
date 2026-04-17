import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// Schema
const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  industry: String,
});

const Company = mongoose.model("Company", companySchema);

// ✅ GET with Filters + Pagination
app.get("/api/companies", async (req, res) => {
  try {
    const {
      search,
      location,
      industry,
      sort = "name", 
      order = "asc",  
      page = 1,
      limit = 6,
    } = req.query;

    let query = {};

    // 🔍 Search
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // 📍 Location filter
    if (location) {
      query.location = location;
    }

    // 🏢 Industry filter
    if (industry) {
      query.industry = industry;
    }

    const skip = (page - 1) * limit;

    // 🔽 Sorting logic
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    // Total count
    const total = await Company.countDocuments(query);

    const companies = await Company.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      data: companies,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/locations", async (req, res) => {
  try {
    const locations = await Company.distinct("location");
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching locations" });
  }
});

app.get("/api/industries", async (req, res) => {
  try {
    const industries = await Company.distinct("industry");
    res.json(industries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching industries" });
  }});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});