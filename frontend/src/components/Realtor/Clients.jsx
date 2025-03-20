import React, { useState, useEffect, useContext } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  FaEnvelope,
  FaHome,
  FaSearch,
  FaCalendar,
  FaList,
  FaTh,
  FaStream,
  FaUser,
} from 'react-icons/fa';
import { ThemeContext } from './ThemeContext';

const GET_BOOKINGS = gql`
  query GetBookings($realtorId: ID) {
    getBookings(realtorId: $realtorId) {
      id
      date
      startTime
      endTime
      client {
        firstName
        lastName
        email
        profilePicture
      }
      property {
        title
      }
    }
  }
`;

const ClientsPage = () => {
  const { themeClasses } = useContext(ThemeContext);
  const storedUser = localStorage.getItem('user');
  let realtorId = null;
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      realtorId = userObj.id;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }

  const { data, loading, error } = useQuery(GET_BOOKINGS, {
    variables: { realtorId },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewType, setViewType] = useState('table');
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    if (data && data.getBookings) {
      let tempBookings = [...data.getBookings];
      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        tempBookings = tempBookings.filter((booking) => {
          const clientName =
            (booking.client?.firstName ? booking.client.firstName.toLowerCase() : '') +
            ' ' +
            (booking.client?.lastName ? booking.client.lastName.toLowerCase() : '');
          const clientEmail = booking.client?.email?.toLowerCase() || '';
          const propertyTitle = booking.property?.title?.toLowerCase() || '';
          return (
            clientName.includes(lowerSearch) ||
            clientEmail.includes(lowerSearch) ||
            propertyTitle.includes(lowerSearch)
          );
        });
      }
      tempBookings.sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
      );
      setFilteredBookings(tempBookings);
    }
  }, [data, searchQuery, sortOrder]);

  const renderViewToggle = () => (
    <div className="flex justify-end mb-4 space-x-2">
      <button
        onClick={() => setViewType('table')}
        className={`px-4 py-2 border border-r-0 rounded-l-md focus:outline-none transition-colors duration-200 ${
          viewType === 'table'
            ? `${themeClasses.primaryBg} text-white`
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FaList className="inline-block mr-1" /> Table
      </button>
      <button
        onClick={() => setViewType('card')}
        className={`px-4 py-2 border border-r-0 focus:outline-none transition-colors duration-200 ${
          viewType === 'card'
            ? `${themeClasses.primaryBg} text-white`
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FaTh className="inline-block mr-1" /> Card
      </button>
      <button
        onClick={() => setViewType('timeline')}
        className={`px-4 py-2 border rounded-r-md focus:outline-none transition-colors duration-200 ${
          viewType === 'timeline'
            ? `${themeClasses.primaryBg} text-white`
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FaStream className="inline-block mr-1" /> Timeline
      </button>
    </div>
  );

  // Helper to generate profile image URL
  const getProfilePicUrl = (profilePicture) =>
    profilePicture ? `http://localhost:5373${profilePicture}` : null;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Client Bookings</h2>
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex items-center bg-white p-3 rounded-md shadow-md w-full md:w-1/3">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, email or property..."
            className="bg-transparent border-none focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center bg-white p-3 rounded-md shadow-md w-full md:w-1/4">
          <label htmlFor="sortOrder" className="mr-2 text-gray-600 font-medium">
            Sort by Date:
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-transparent border-none focus:outline-none w-full"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 overflow-x-auto">
        {loading ? (
          <p className="text-gray-600">Loading bookings...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : filteredBookings.length > 0 ? (
          <>
            {renderViewToggle()}
            {viewType === 'table' && (
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Client Name
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Property
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Booking Date
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        <div className="flex items-center">
                          {booking.client?.profilePicture ? (
                            <img
                              src={getProfilePicUrl(booking.client.profilePicture)}
                              alt="Client Profile"
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          ) : (
                            <FaUser className="text-blue-500 mr-2" />
                          )}
                          {booking.client?.firstName} {booking.client?.lastName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        <div className="flex items-center">
                          <FaEnvelope className="text-gray-500 mr-2" />
                          {booking.client?.email}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        <div className="flex items-center">
                          <FaHome className="text-green-500 mr-2" />
                          {booking.property?.title}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        <div className="flex items-center">
                          <FaCalendar className="text-purple-500 mr-2" />
                          {new Date(booking.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        {booking.startTime} - {booking.endTime} hrs EST
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {viewType === 'card' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-gray-50 border rounded-lg p-4 hover:shadow-lg transition-transform duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center mb-2">
                      {booking.client?.profilePicture ? (
                        <img
                          src={getProfilePicUrl(booking.client.profilePicture)}
                          alt="Client Profile"
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <FaUser className="text-blue-500 mr-2" />
                      )}
                      <span className="text-lg font-semibold text-gray-800">
                        {booking.client?.firstName} {booking.client?.lastName}
                      </span>
                    </div>
                    <p className="flex items-center text-gray-700 mb-1">
                      <FaEnvelope className="text-gray-500 mr-2" /> {booking.client?.email}
                    </p>
                    <p className="flex items-center text-gray-700">
                      <FaHome className="text-green-500 mr-2" /> {booking.property?.title}
                    </p>
                    <p className="flex items-center text-gray-700 mt-2">
                      <FaCalendar className="text-purple-500 mr-2" /> {new Date(booking.date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 text-sm">
                      {booking.startTime} - {booking.endTime} hrs EST
                    </p>
                  </div>
                ))}
              </div>
            )}
            {viewType === 'timeline' && (
              <div className="relative">
                {/* Continuous vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-gray-200"
                  style={{ left: '9rem' }}
                ></div>
                <div className="space-y-8">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="flex items-start">
                      {/* Date/Time Column */}
                      <div className="w-32 text-right pr-4">
                        <p className="text-gray-500 text-sm">
                          {new Date(booking.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {booking.startTime} - {booking.endTime} hrs EST
                        </p>
                      </div>
                      {/* Marker Column */}
                      <div className="w-8 flex justify-center items-center">
                        <div className="h-4 w-4 bg-indigo-600 rounded-full border-2 border-white z-10"></div>
                      </div>
                      {/* Booking Details Column */}
                      <div className="flex-1">
                        <div className="bg-white p-4 rounded-md shadow-lg transition-transform duration-200 hover:scale-105">
                          <div className="flex items-center mb-1">
                            {booking.client?.profilePicture ? (
                              <img
                                src={getProfilePicUrl(booking.client.profilePicture)}
                                alt="Client Profile"
                                className="w-8 h-8 rounded-full mr-2"
                              />
                            ) : (
                              <FaUser className="text-blue-500 mr-2" />
                            )}
                            <span className="font-semibold text-gray-800">
                              {booking.client?.firstName} {booking.client?.lastName}
                            </span>
                          </div>
                          <p className="flex items-center text-gray-700 mb-1">
                            <FaEnvelope className="text-gray-500 mr-2" /> {booking.client?.email}
                          </p>
                          <p className="flex items-center text-gray-700">
                            <FaHome className="text-green-500 mr-2" /> {booking.property?.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-600">No bookings found.</p>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;