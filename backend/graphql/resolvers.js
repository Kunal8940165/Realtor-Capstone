const User = require('../models/User');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");

const { GraphQLUpload } = require('graphql-upload');
const path = require('path');
const fs = require('fs');

const UPLOAD_URL = '/uploads';

const processUploads = async (files) => {
  // files: array of upload objects
  const uploadedUrls = await Promise.all(
    files.map(async (file) => {
      const { createReadStream, filename } = await file;
      const timestamp = Date.now();
      const storedFilename = `${timestamp}-${filename}`;
      const stream = createReadStream();
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      const pathName = path.join(uploadDir, storedFilename);
      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(pathName);
        stream.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
      });
      return `${UPLOAD_URL}/${storedFilename}`;
    })
  );
  return uploadedUrls;
};

module.exports = {
  // Register the Upload scalar for handling file uploads.
  Upload: GraphQLUpload,

  Query: {
    async getUsers() {
      return await User.find();
    },
    async getUserById(_, { id }) {
      return await User.findById(id);
    },
    // Updated getBookings to accept an optional realtorId parameter.
    async getBookings(_, { realtorId }) {
      const query = realtorId ? { realtor: realtorId } : {};
      return await Booking.find(query).populate('client').populate('realtor').populate('property');
    },

    getAllProperties: async (_, { filter }) => {
      let query = { archived: false };  // Ensure only active properties are returned
      if (filter) {
        if (filter.realtor) query.realtor = filter.realtor;
        if (filter.propertyType) query.propertyType = filter.propertyType;
        if (filter.minPrice !== undefined) query.price = { $gte: filter.minPrice };
        if (filter.maxPrice !== undefined)
          query.price = { ...query.price, $lte: filter.maxPrice };
        if (filter.bedrooms !== undefined) query.bedrooms = filter.bedrooms;
        if (filter.bathrooms !== undefined) query.bathrooms = filter.bathrooms;
        if (filter.location) query.location = filter.location;
        if (filter.dateListed) query.createdAt = { $gte: new Date(filter.dateListed) };
      }
      let sort = {};
      if (filter && filter.sort) {
        switch (filter.sort) {
          case "newest":
            sort = { createdAt: -1 };
            break;
          case "oldest":
            sort = { createdAt: 1 };
            break;
          case "highestPrice":
            sort = { price: -1 };
            break;
          case "lowestPrice":
            sort = { price: 1 };
            break;
          default:
            sort = { createdAt: -1 };
        }
      }
      return await Property.find(query).sort(sort).populate('realtor');
    },
    

    
    getUniqueLocations: async () => {
      const locations = await Property.distinct('location');
      return locations;
    },
    getPropertyById: async (_, { id }) => {
      return await Property.findById(id).populate('realtor');
    },
  },
  Mutation: {
    async createUser(_, { input, profilePicture }) {
      try {
        const { firstName, lastName, gender, phoneNumber, email, password, confirmPassword, role } = input;

        // Validate required fields
        if (!firstName || !lastName || !gender || !phoneNumber || !email || !password || !confirmPassword) {
          throw new Error('All fields are required.');
        }

        // Confirm password matches
        if (password !== confirmPassword) {
          throw new Error('Password and Confirm Password must match.');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format.');
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('Email is already registered.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle file upload for profile picture if provided
        let profilePictureUrl = '/uploads/default-profile.jpg'; // default picture if none is provided
        if (profilePicture) {
          const { createReadStream, filename } = await profilePicture;
          const timestamp = Date.now();
          const storedFilename = `${timestamp}-${filename}`;
          const stream = createReadStream();
          const uploadDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
          }

          const pathName = path.join(uploadDir, storedFilename);
          await new Promise((resolve, reject) => {
            const out = fs.createWriteStream(pathName);
            stream.pipe(out);
            out.on('finish', resolve);
            out.on('error', reject);
          });

          profilePictureUrl = `${UPLOAD_URL}/${storedFilename}`;
        }

        // Create new user
        const newUser = new User({
          firstName,
          lastName,
          gender,
          phoneNumber,
          email,
          password: hashedPassword,
          confirmPassword: hashedPassword, // storing hash of confirmPassword for comparison
          profilePicture: profilePictureUrl,
          role,
        });

        return await newUser.save();
      } catch (error) {
        throw new Error(error.message);
      }
    },

    async login(_, { email, password }) {
      try {
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials.');
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return { token, user };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    async updateUser(_, { id, input, profilePicture }) {
      const updatedUserData = input;

      if (profilePicture) {
        // Handle file upload
        const { createReadStream, filename } = await profilePicture;
        const timestamp = Date.now();
        const storedFilename = `${timestamp}-${filename}`;
        const stream = createReadStream();

        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir);
        }

        const pathName = path.join(uploadDir, storedFilename);

        await new Promise((resolve, reject) => {
          const out = fs.createWriteStream(pathName);
          stream.pipe(out);
          out.on('finish', resolve);
          out.on('error', reject);
        });

        updatedUserData.profilePicture = `${UPLOAD_URL}/${storedFilename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(id, updatedUserData, { new: true });
      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    },

    async deleteUser(_, { id }) {
      const deletedUser = await User.findByIdAndDelete(id);
      return !!deletedUser;
    },

    async resetPassword(_, { input }){
      const { email } = input;

      if (!email) {
        throw new Error('Please enter your email address.');
      }
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('No account found with this email.');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      const resetLink = `${process.env.APP_URL}reset-password?token=${resetToken}`;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Your Company" <no-reply@real-state.com>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}" target="_blank">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        return user;
      } catch (error) {
        throw new Error('Error sending email. Please try again.');
      }
    },

    async resetPasswordWithToken(_, { input }) {
      try {
        const { token, password } = input;
  
        if (!token || !password) {
          throw new Error('Invalid request. Please provide all the fields');
        }
  
        const user = await User.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() }, 
        });
  
        if (!user) {
          throw new Error('Invalid or expired reset token.');
        }
  
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error(
            'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
          );
        }
  
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
  
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
  
        await user.save();
  
        return {
          success: true,
          message: 'Your password has been successfully updated. Redirecting to login...',
          redirectTo: '/login',
        };
      } catch (error) {
        console.error('Reset Password Error:', error.message);
        throw new Error(error.message || 'Something went wrong. Please try again.');
      }
    },

    // BOOKING APIs

    createBooking: async (_, { input }) => {
      try {
        const newBooking = new Booking({
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          mode: input.mode,
          notes: input.notes,
          // Depending on your application flow, you may assign
          // the realtor, client, and property here.
        });

        await newBooking.save();

        let emailBody = `
          <p>You have a new booking request:</p>
          <p><strong>Date:</strong> ${input.date}</p>
          <p><strong>Time:</strong> ${input.startTime} - ${input.endTime}</p>
          <p><strong>Meeting Type:</strong> ${input.mode}</p>
          <p><strong>Notes:</strong> ${input.notes || "N/A"}</p>
          <p>Please confirm this appointment.</p>
        `;

        const zoomRequired = input.mode === "ZOOM";
        const zoomLink = await sendEmail("realtor@example.com", "New Booking Request", emailBody, zoomRequired);

        const response = { ...newBooking._doc, zoomLink };
        return response;
      } catch (error) {
        console.error("❌ Error creating booking:", error);
        throw new Error("Failed to create booking");
      }
    },

    confirmBooking: async (_, { id }) => {
      const booking = await Booking.findById(id);
      if (!booking) throw new Error("Booking not found");

      booking.status = "CONFIRMED";

      if (booking.mode === "ZOOM") {
        booking.zoomLink = "https://zoom.us/dummy-meeting-link";
      } else {
        booking.officeAddress = "1234 Real Estate Office, Toronto, ON";
      }

      await booking.save();

      const confirmationBody = `
        <p>Your appointment has been confirmed:</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Meeting Type:</strong> ${booking.mode}</p>
        ${booking.zoomLink ? `<p><strong>Zoom Link:</strong> ${booking.zoomLink}</p>` : ""}
        ${booking.officeAddress ? `<p><strong>Office Address:</strong> ${booking.officeAddress}</p>` : ""}
        <p>Thank you for booking with us!</p>
      `;
      await sendEmail(booking.client.email, "Your Appointment is Confirmed", confirmationBody);

      return booking;
    },

    addProperty: async (_, args) => {
      try {
        // If images are provided as file uploads, process them
        if (args.images && args.images.length) {
          args.images = await processUploads(args.images);
        }
        const newProperty = new Property(args);
        await newProperty.save();
        return newProperty.populate('realtor');
      } catch (error) {
        throw new Error("Error adding property");
      }
    },

    updateProperty: async (_, { id, ...updates }) => {
      try {
        // If new image files are provided, process them; otherwise, leave images unchanged
        if (updates.images && updates.images.length) {
          updates.images = await processUploads(updates.images);
        }
        const updatedProperty = await Property.findByIdAndUpdate(id, updates, { new: true }).populate('realtor');
        if (!updatedProperty) throw new Error("Property not found");
        return updatedProperty;
      } catch (error) {
        throw new Error("Error updating property");
      }
    },

    deleteProperty: async (_, { id }) => {
      try {
        const updatedProperty = await Property.findByIdAndUpdate(
          id,
          { archived: true },
          { new: true }
        );
        if (!updatedProperty) throw new Error("Property not found");
        return "Property archived successfully";
      } catch (error) {
        throw new Error("Error archiving property");
      }
    }
  },

  Property: {
    realtor: async (property) => {
      return await User.findById(property.realtor);
    },
  },

  Booking: {
    // These resolvers ensure that the client and realtor fields are properly resolved.
    date: (booking) => new Date(booking.date).toISOString(),
    client: async (booking) => {
      return await User.findById(booking.client);
    },
    realtor: async (booking) => {
      return await User.findById(booking.realtor);
    }
  }
};
