const express = require("express");
const { auth, isStudent } = require("../middleware/auth");
const { getUserReviews, deleteReview } = require("../controllers/Review");

const router = express.Router();

// Get all reviews for the logged-in user
router.get("/my-reviews", auth, isStudent, getUserReviews);

// Delete a review
router.delete("/delete-review", auth, isStudent, deleteReview);

module.exports = router;
