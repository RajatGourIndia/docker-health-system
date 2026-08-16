const bcrypt = require('bcryptjs');
const adminStore = require('../storage/adminStore');

const MIN_PASSWORD_LENGTH = 8;

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function hasAdmin() {
  return Boolean(adminStore.getAdmin());
}

async function createAdmin(username, password) {
  if (hasAdmin()) {
    throw new AuthError('An admin account already exists', 409);
  }
  if (!username || !username.trim()) {
    throw new AuthError('Username is required', 400);
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  adminStore.saveAdmin({ username: username.trim(), passwordHash });
}

async function verifyLogin(username, password) {
  const admin = adminStore.getAdmin();
  if (!admin) {
    throw new AuthError('No admin account exists yet', 409);
  }
  // Always run bcrypt.compare even when the username is already wrong, so a
  // mismatched username doesn't return faster than a mismatched password —
  // that timing difference is otherwise a username-enumeration side channel.
  const passwordMatches = await bcrypt.compare(password || '', admin.passwordHash);
  if (username !== admin.username || !passwordMatches) {
    throw new AuthError('Invalid credentials', 401);
  }
  return admin.username;
}

async function changePassword(currentPassword, newPassword) {
  const admin = adminStore.getAdmin();
  if (!admin) {
    throw new AuthError('No admin account exists', 409);
  }
  const matches = await bcrypt.compare(currentPassword || '', admin.passwordHash);
  if (!matches) {
    throw new AuthError('Current password is incorrect', 401);
  }
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  adminStore.saveAdmin({ ...admin, passwordHash });
}

async function resetPassword(newPassword) {
  const admin = adminStore.getAdmin();
  if (!admin) {
    throw new AuthError('No admin account exists yet — use first-run setup instead', 409);
  }
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  adminStore.saveAdmin({ ...admin, passwordHash });
}

module.exports = {
  AuthError,
  hasAdmin,
  createAdmin,
  verifyLogin,
  changePassword,
  resetPassword,
};
