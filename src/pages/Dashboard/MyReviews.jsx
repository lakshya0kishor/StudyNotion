import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaStar, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { apiConnector } from "../../services/apiConnector";
import { reviewEndpoints } from "../../services/apis";

const { GET_USER_REVIEWS, DELETE_REVIEW } = reviewEndpoints;

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserReviews = async () => {
      setLoading(true);
      try {
        const response = await apiConnector(
          "GET",
          GET_USER_REVIEWS,
          null,
          {
            Authorization: `Bearer ${token}`,
          }
        );

        if (response.data.success) {
          setReviews(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        toast.error("Failed to load your reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [token]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    const toastId = toast.loading("Deleting review...");
    
    try {
      const response = await apiConnector(
        "DELETE",
        DELETE_REVIEW,
        { reviewId },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      if (response.data.success) {
        // Remove the deleted review from the list
        setReviews(reviews.filter((review) => review._id !== reviewId));
        toast.success("Review deleted successfully", { id: toastId });
      } else {
        throw new Error(response.data.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error.message || "Failed to delete review", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-richblack-5 mb-6">
        My Course Reviews
      </h1>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-richblack-200">You haven't reviewed any courses yet.</p>
          <button
            onClick={() => navigate("/dashboard/enrolled-courses")}
            className="mt-4 px-4 py-2 bg-yellow-50 text-richblack-900 font-medium rounded-lg hover:bg-yellow-100 transition-colors"
          >
            View Your Enrolled Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-richblack-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-richblack-5">
                    {review.course?.courseName || "Course"}
                  </h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-${
                            i < review.rating ? "yellow-400" : "richblack-400"
                          } text-sm`}
                        />
                      ))}
                    </div>
                    <span className="text-yellow-400 text-sm font-medium">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  className="text-richblack-300 hover:text-pink-500 transition-colors p-1"
                  title="Delete review"
                >
                  <FaTrashAlt className="h-4 w-4" />
                </button>
              </div>

              <p className="text-richblack-100 text-sm mb-4 line-clamp-3">
                {review.review}
              </p>

              <div className="text-xs text-richblack-300">
                Reviewed on {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
