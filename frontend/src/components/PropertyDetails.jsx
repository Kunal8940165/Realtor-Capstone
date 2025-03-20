// PropertyDetails.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import Navbar from './Navbar';
import { FaBed, FaBath, FaRulerCombined, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const GET_PROPERTY_BY_ID = gql`
  query GetPropertyById($id: ID!) {
    getPropertyById(id: $id) {
      id
      title
      description
      price
      location
      bedrooms
      bathrooms
      propertyType
      squareFeet
      furnished
      hasParking
      features
      realtor {
        firstName
        lastName
        email
        profilePicture
        phoneNumber
      }
      images
      createdAt
    }
  }
`;

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_PROPERTY_BY_ID, {
    variables: { id },
  });

  // State for image slider index
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  if (loading) return <p className="pt-20 text-center">Loading...</p>;
  if (error) return <p className="pt-20 text-center text-red-500">Error loading property details.</p>;

  const property = data.getPropertyById;

  // Handlers for slider navigation
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <>
      <Navbar />
      <div className="pt-20 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-500 hover:underline mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Listings
          </button>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {property.images && property.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={`http://localhost:5373${property.images[currentIndex]}`}
                    alt={`${property.title} ${currentIndex + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                    onLoad={() => setIsImageLoaded(true)}
                  />
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
                      >
                        <FaChevronLeft className="text-gray-700" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
                      >
                        <FaChevronRight className="text-gray-700" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <img
                  src="https://placehold.co/400x300"
                  alt={property.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

<div className="mt-4">
                <h3 className="text-2xl font-bold text-purple-800">Realtor Information</h3>
                <div className="flex items-center gap-4 mt-2">
                  {property.realtor.profilePicture && (
                    <img
                      src={`http://localhost:5373${property.realtor.profilePicture}`}
                      alt="Realtor"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {property.realtor.firstName} {property.realtor.lastName}
                    </p>
                    <p className="text-gray-600">{property.realtor.email}</p>
                    <p className="text-gray-600">{property.realtor.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{property.title}</h1>
              <p className="text-gray-600 mt-2">{property.location}</p>
              <p className="text-xl font-bold text-purple-600 mt-2">${property.price}</p>
              <div className="flex gap-4 mt-4 text-gray-700">
                <div className="flex items-center gap-1">
                  <FaBed /> <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaBath /> <span>{property.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaRulerCombined /> <span>{property.squareFeet} sqft</span>
                </div>
              </div>
              <p className="mt-4 text-gray-700">{property.description}</p>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-purple-800">Features</h3>
                {property.features && property.features.length > 0 ? (
                  <ul className="list-disc ml-6 mt-2">
                    {property.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No features listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDetails;
