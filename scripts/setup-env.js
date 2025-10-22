#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps users set up their environment variables
 * by creating a .env.local file from the example.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Setting up environment variables for Personal Budget App\n');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env.local already exists
  if (fs.existsSync(envLocalPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ .env.example not found. Please create it first.');
    rl.close();
    return;
  }
  
  console.log('📋 Please provide your Firebase configuration values.\n');
  console.log('You can find these in your Firebase Console > Project Settings > General > Your apps\n');
  
  try {
    // Read the example file
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Get Firebase values from user
    const firebaseApiKey = await question('Firebase API Key: ');
    const firebaseAuthDomain = await question('Firebase Auth Domain (e.g., your-project.firebaseapp.com): ');
    const firebaseProjectId = await question('Firebase Project ID: ');
    const firebaseStorageBucket = await question('Firebase Storage Bucket (e.g., your-project.firebasestorage.app): ');
    const firebaseMessagingSenderId = await question('Firebase Messaging Sender ID: ');
    const firebaseAppId = await question('Firebase App ID: ');
    const firebaseMeasurementId = await question('Firebase Measurement ID (optional, press Enter to skip): ');
    
    // Replace placeholders with actual values
    let envContent = exampleContent
      .replace('your_firebase_api_key_here', firebaseApiKey)
      .replace('your_project_id.firebaseapp.com', firebaseAuthDomain)
      .replace('your_project_id', firebaseProjectId)
      .replace('your_project_id.firebasestorage.app', firebaseStorageBucket)
      .replace('your_messaging_sender_id', firebaseMessagingSenderId)
      .replace('your_app_id', firebaseAppId);
    
    // Handle optional measurement ID
    if (firebaseMeasurementId.trim()) {
      envContent = envContent.replace('your_measurement_id', firebaseMeasurementId);
    } else {
      envContent = envContent.replace('VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id', '# VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id');
    }
    
    // Write the .env.local file
    fs.writeFileSync(envLocalPath, envContent);
    
    console.log('\n✅ Environment variables set up successfully!');
    console.log(`📁 Created: ${envLocalPath}`);
    console.log('\n🔒 Security reminder:');
    console.log('- .env.local is already in .gitignore');
    console.log('- Never commit this file to version control');
    console.log('- Keep your Firebase keys secure');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run "npm run dev" to start development server');
    console.log('2. Run "npm run validate:env" to verify setup');
    console.log('3. For deployment, set variables in your deployment platform');
    console.log('4. See ENVIRONMENT_VARIABLES_GUIDE.md for deployment instructions');
    
  } catch (error) {
    console.error('❌ Error setting up environment variables:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup
setupEnvironment();