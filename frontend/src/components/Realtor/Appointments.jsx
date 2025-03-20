import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import { useMutation, gql } from "@apollo/client";

// Set the root element for accessibility
Modal.setAppElement("#root");

// GraphQL Mutations
const CREATE_BOOKING = gql`
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      date
      startTime
      endTime
      mode
      status,
    }
  }
`;

const AppointmentsPage = () => {
  const [events, setEvents] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    startTime: "07:00",
    endTime: "08:00",
    meetingType: "Zoom",
    status: "PENDING"
  });

  const [createBooking] = useMutation(CREATE_BOOKING);

  // Handle clicking on a date
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setModalIsOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save the booking
  const handleSaveBooking = async () => {
    if (!formData.firstName || !formData.email || !formData.phone || !formData.startTime || !formData.endTime) {
      setMessage("Please fill all required fields!");
      return;
    }

    try {
      const { data } = await createBooking({
        variables: {
          input: {
            // client: "605c72ef153207001f7f4e6",
            // property: "605c72ef153207001f7f4e7",
            // realtor: "679bd4c89ba5641e98d42dd7", 
            date: selectedDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            mode: formData.meetingType.toUpperCase(),
            notes: formData.notes,
            status:"PENDING"
          },
        },
      });

      if (data.createBooking) {
        const newEvent = {
          title: `${formData.firstName} (${formData.meetingType})`,
          start: `${selectedDate}T${formData.startTime}`,
          end: `${selectedDate}T${formData.endTime}`,
          backgroundColor: "purple",
          textColor: "white",
        };

        setEvents([...events, newEvent]);
        setMessage("Booking request sent! Waiting for confirmation.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setMessage("Failed to create booking.");
    }

    setModalIsOpen(false);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", notes: "", startTime: "07:00", endTime: "08:00", meetingType: "Zoom" });
  };

  return (
    <div className="p-6 bg-gray-100 h-screen">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upcoming Appointments</h2>
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" dateClick={handleDateClick} events={events} />
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
            zIndex: 1000, // Ensure it's above everything
          },
          content: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            maxHeight: "80vh",
            overflowY: "auto",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <h2 className="text-xl font-semibold mb-4">Book an Appointment</h2>
        <label className="block mb-2">Name:</label>
        <input type="text" name="name" value={formData.firstName} onChange={handleInputChange} className="w-full p-2 border rounded mb-4" />
        <label className="block mb-2">Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded mb-4" />
        <label className="block mb-2">Phone:</label>
        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border rounded mb-4" />
        <label className="block mb-2">Notes:</label>
        <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full p-2 border rounded mb-4"></textarea>
        <label className="block mb-2">Start Time:</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full p-2 border rounded mb-4" />
        <label className="block mb-2">End Time:</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full p-2 border rounded mb-4" />
        <label className="block mb-2">Meeting Type:</label>
        <select name="meetingType" value={formData.meetingType} onChange={handleInputChange} className="w-full p-2 border rounded mb-4">
          <option value="Zoom">Zoom</option>
          <option value="In-Person">In-Person</option>
        </select>
        <button onClick={handleSaveBooking} className="bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-500 transition">Save Booking</button>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
