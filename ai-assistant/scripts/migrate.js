// scripts/migrate.js
const { execSync } = require('child_process');
const path = require('path');

/**
 * This script runs Prisma migrations in production environments.
 * It can be used as a post-deployment script on platforms like Railway.
 */
async function main() {
  try {
    console.log('Running Prisma migrations...');
    
    // Run the migrations
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../')
    });
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

main();