const RatingAndReview = require("../models/RatingandReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

// Get all reviews for the logged-in user
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all reviews by the user and populate course details
    const userReviews = await RatingAndReview.find({ user: userId })
      .populate({
        path: "course",
        select: "courseName thumbnail",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: userReviews,
      message: "User reviews fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user reviews",
      error: error.message,
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { reviewId } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = await RatingAndReview.findById(reviewId).session(session);

    if (!review) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if the review belongs to the logged-in user
    if (review.user.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own reviews",
      });
    }

    // Store course ID before deleting the review
    const courseId = review.course;
    
    // Delete the review
    await RatingAndReview.findByIdAndDelete(reviewId).session(session);

    // Remove the review reference from the course
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { ratingAndReviews: reviewId } },
      { new: true, session }
    );

    // Recalculate average rating for the course
    const reviews = await RatingAndReview.find({ course: courseId }).session(session);
    
    let totalRating = 0;
    reviews.forEach((review) => {
      totalRating += review.rating;
    });
    
    const averageRating = reviews.length > 0 ? Math.round(totalRating / reviews.length * 10) / 10 : 0;
    
    // Update the course's average rating and rating count
    await Course.findByIdAndUpdate(
      courseId,
      { 
        $set: { 
          rating: averageRating,
          ratingCount: reviews.length
        } 
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

module.exports = {
  getUserReviews,
  deleteReview,
};
