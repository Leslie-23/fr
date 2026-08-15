const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional: accounts created via Google sign-in have no password.
    passwordHash: { type: String, required: false, default: null },
    // Optional: set once a user links (or signs up via) Google.
    googleId: { type: String, required: false, unique: true, sparse: true },
    // Soft-delete: "deleting" an account deactivates it rather than removing the row, so
    // business/entry data (linked by userId, not deleted here) stays intact.
    active: { type: Boolean, required: true, default: true },
    deactivatedAt: { type: Date, required: false, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const UserModel = model('User', userSchema);

module.exports = { UserModel };
