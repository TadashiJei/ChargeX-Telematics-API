import mongoose from 'mongoose';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken } from '../utils/auth.js';

const userSchema = new mongoose.Schema({
  // User's name
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // User's email (unique)
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  
  // User's password (hashed)
  password: {
    type: String,
    required: true
  },
  
  // User's role (user, admin, technician)
  role: {
    type: String,
    enum: ['user', 'admin', 'technician'],
    default: 'user',
    index: true
  },
  
  // User's active status
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // User's profile picture URL
  profilePicture: {
    type: String,
    default: null
  },
  
  // User's phone number
  phone: {
    type: String,
    default: null
  },
  
  // User's company or organization
  organization: {
    type: String,
    default: null
  },
  
  // User's job title
  jobTitle: {
    type: String,
    default: null
  },
  
  // User's preferences
  preferences: {
    // Theme preference (light, dark, system)
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    
    // Notification preferences
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    
    // Dashboard layout
    dashboardLayout: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // User's active tokens
  tokens: [{
    token: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    device: {
      type: String,
      default: 'Unknown'
    },
    ip: {
      type: String,
      default: null
    },
    lastUsed: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  
  // Password reset token
  resetToken: {
    token: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  
  // Email verification token
  verificationToken: {
    token: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  
  // Email verification status
  verified: {
    type: Boolean,
    default: false
  },
  
  // Last login timestamp
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Failed login attempts
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  
  // Account lockout timestamp
  lockedUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password')) {
    return next();
  }
  
  try {
    // Hash password
    user.password = hashPassword(user.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password
userSchema.methods.verifyPassword = function(password) {
  return verifyPassword(password, this.password);
};

// Method to generate auth tokens
userSchema.methods.generateAuthTokens = async function(device = 'Unknown', ip = null) {
  const user = this;
  
  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken();
  
  // Calculate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Add tokens to user's tokens array
  user.tokens.push({
    token,
    refreshToken,
    device,
    ip,
    lastUsed: new Date(),
    expiresAt
  });
  
  // Update last login timestamp
  user.lastLogin = new Date();
  
  // Reset failed login attempts
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  
  // Save user
  await user.save();
  
  return { token, refreshToken, expiresAt };
};

// Method to revoke token
userSchema.methods.revokeToken = async function(token) {
  const user = this;
  
  // Remove token from user's tokens array
  user.tokens = user.tokens.filter(t => t.token !== token);
  
  // Save user
  await user.save();
  
  return user;
};

// Method to revoke all tokens
userSchema.methods.revokeAllTokens = async function() {
  const user = this;
  
  // Clear tokens array
  user.tokens = [];
  
  // Save user
  await user.save();
  
  return user;
};

// Method to generate password reset token
userSchema.methods.generateResetToken = async function() {
  const user = this;
  
  // Generate token
  const token = generateRefreshToken();
  
  // Calculate expiration date (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  // Set reset token
  user.resetToken = {
    token,
    expiresAt
  };
  
  // Save user
  await user.save();
  
  return token;
};

// Method to generate email verification token
userSchema.methods.generateVerificationToken = async function() {
  const user = this;
  
  // Generate token
  const token = generateRefreshToken();
  
  // Calculate expiration date (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // Set verification token
  user.verificationToken = {
    token,
    expiresAt
  };
  
  // Save user
  await user.save();
  
  return token;
};

// Method to verify email
userSchema.methods.verifyEmail = async function() {
  const user = this;
  
  // Set verified flag
  user.verified = true;
  
  // Clear verification token
  user.verificationToken = {
    token: null,
    expiresAt: null
  };
  
  // Save user
  await user.save();
  
  return user;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by token
userSchema.statics.findByToken = function(token) {
  return this.findOne({ 'tokens.token': token });
};

// Static method to find user by refresh token
userSchema.statics.findByRefreshToken = function(refreshToken) {
  return this.findOne({ 'tokens.refreshToken': refreshToken });
};

// Static method to find user by reset token
userSchema.statics.findByResetToken = function(token) {
  return this.findOne({ 
    'resetToken.token': token,
    'resetToken.expiresAt': { $gt: new Date() }
  });
};

// Static method to find user by verification token
userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({ 
    'verificationToken.token': token,
    'verificationToken.expiresAt': { $gt: new Date() }
  });
};

const User = mongoose.model('User', userSchema);

export default User;
