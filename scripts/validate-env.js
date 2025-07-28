#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * This script validates that all required environment variables are set
 * before building or deploying the application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Optional environment variables
const optionalEnvVars = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_APP_ENV',
  'VITE_ENABLE_ANALYTICS'
];

function validateEnvironmentVariables() {
  console.log('🔍 Validating environment variables...\n');
  
  const missingVars = [];
  const presentVars = [];
  const optionalPresent = [];
  
  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      presentVars.push(envVar);
    } else {
      missingVars.push(envVar);
    }
  }
  
  // Check optional variables
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      optionalPresent.push(envVar);
    }
  }
  
  // Display results
  console.log('✅ Required variables found:');
  if (presentVars.length > 0) {
    presentVars.forEach(varName => {
      const value = process.env[varName];
      const maskedValue = value.length > 8 ? 
        value.substring(0, 4) + '...' + value.substring(value.length - 4) : 
        '***';
      console.log(`   ${varName}: ${maskedValue}`);
    });
  } else {
    console.log('   None found');
  }
  
  console.log('\n❌ Missing required variables:');
  if (missingVars.length > 0) {
    missingVars.forEach(varName => {
      console.log(`   ${varName}`);
    });
  } else {
    console.log('   None missing');
  }
  
  console.log('\n🔧 Optional variables found:');
  if (optionalPresent.length > 0) {
    optionalPresent.forEach(varName => {
      console.log(`   ${varName}: ${process.env[varName]}`);
    });
  } else {
    console.log('   None found');
  }
  
  // Check if .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log('\n📁 .env.local file found');
  } else {
    console.log('\n⚠️  .env.local file not found');
    console.log('   Consider creating one for local development');
  }
  
  // Final validation
  if (missingVars.length > 0) {
    console.log('\n❌ Validation failed!');
    console.log('Please set all required environment variables before proceeding.');
    console.log('\nTo set up environment variables:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in your Firebase configuration values');
    console.log('3. For deployment, set variables in your deployment platform');
    console.log('\nSee ENVIRONMENT_VARIABLES_GUIDE.md for detailed instructions.');
    process.exit(1);
  } else {
    console.log('\n✅ All required environment variables are set!');
    console.log('You can proceed with building and deploying your application.');
  }
}

// Run validation
validateEnvironmentVariables();