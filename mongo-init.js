// MongoDB initialization script
// This script creates the user when MongoDB is first started

db = db.getSiblingDB('asterion');

// Create user with read-write access to the asterion database
db.createUser({
  user: 'asterion',
  pwd: 'asterionpass',
  roles: [
    {
      role: 'readWrite',
      db: 'asterion'
    }
  ]
});

print('User asterion created successfully');