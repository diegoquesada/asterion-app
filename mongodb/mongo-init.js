// MongoDB initialization script
// This script creates the application user when MongoDB first starts
//
// Environment variables are passed from docker-compose.yml via env_file:
// - MONGO_USER: username for the app user
// - MONGO_PASSWORD: password for the app user

// Get credentials from environment variables
var appUser = _getEnv('MONGO_USER');
var appPassword = _getEnv('MONGO_PASSWORD');

// Create the application database user with read-write access
var appDb = db.getSiblingDB('asterion');
appDb.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [
        { role: 'readWrite', db: 'asterion' }
    ]
});

print('Created application user: ' + appUser);
