#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * Bu script tüm .env.example dosyalarını kopyalayarak
 * .env dosyalarını otomatik olarak oluşturur.
 * 
 * Kullanım:
 *   npm run setup:env
 *   node scripts/setup-env.js
 *   node scripts/setup-env.js --force (yedek almadan)
 *   node scripts/setup-env.js --dry-run (sadece rapor)
 */

const fs = require('fs');
const path = require('path');

// Komut satırı argümanları
const args = process.argv.slice(2);
const forceMode = args.includes('--force');
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

// Environment dosyaları yapılandırması
const envFiles = [
  {
    example: '.env.example',
    target: '.env',
    description: 'Root environment file (Docker Compose)',
    required: true
  },
  {
    example: 'backend/.env.example',
    target: 'backend/.env',
    description: 'Backend environment file',
    required: true
  },
  {
    example: 'frontend/.env.local.example',
    target: 'frontend/.env.local',
    description: 'Frontend environment file',
    required: true
  }
];

// Renkli console output için
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// Ana script
function main() {
  log('\n🚀 Environment Setup Script\n', colors.bright + colors.blue);
  
  if (dryRun) {
    logWarning('Running in DRY RUN mode - No files will be modified\n');
  }
  
  if (forceMode) {
    logWarning('Running in FORCE mode - Existing files will be overwritten without backup\n');
  }

  let hasErrors = false;
  let createdCount = 0;
  let skippedCount = 0;
  let backedUpCount = 0;

  envFiles.forEach(({ example, target, description, required }) => {
    log(`\n📝 ${description}`, colors.bright);
    
    // Check if example file exists
    if (!fs.existsSync(example)) {
      if (required) {
        logError(`Example file not found: ${example}`);
        hasErrors = true;
      } else {
        logWarning(`Optional example file not found: ${example} (skipping)`);
        skippedCount++;
      }
      return;
    }

    if (verbose) {
      logInfo(`Source: ${example}`);
      logInfo(`Target: ${target}`);
    }

    // Check if target already exists
    if (fs.existsSync(target)) {
      if (!forceMode && !dryRun) {
        const backupFile = `${target}.bak`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const timestampedBackup = `${target}.${timestamp}.bak`;
        
        try {
          fs.copyFileSync(target, timestampedBackup);
          logInfo(`Backed up existing file to: ${timestampedBackup}`);
          backedUpCount++;
        } catch (error) {
          logError(`Failed to backup file: ${error.message}`);
          hasErrors = true;
          return;
        }
      } else if (forceMode) {
        logWarning(`Overwriting existing file without backup: ${target}`);
      }
    }

    // Copy file
    if (!dryRun) {
      try {
        fs.copyFileSync(example, target);
        logSuccess(`Created: ${target}`);
        createdCount++;
      } catch (error) {
        logError(`Failed to create file: ${error.message}`);
        hasErrors = true;
      }
    } else {
      logInfo(`Would create: ${target}`);
      createdCount++;
    }
  });

  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('Summary', colors.bright);
  log('='.repeat(60) + '\n', colors.cyan);

  if (!dryRun) {
    logSuccess(`Created: ${createdCount} file(s)`);
    if (backedUpCount > 0) {
      logInfo(`Backed up: ${backedUpCount} file(s)`);
    }
    if (skippedCount > 0) {
      logWarning(`Skipped: ${skippedCount} file(s)`);
    }
  } else {
    logInfo(`Would create: ${createdCount} file(s)`);
  }

  if (!hasErrors && !dryRun) {
    log('\n✨ Environment files setup completed successfully!\n', colors.green + colors.bright);
    
    log('⚠️  IMPORTANT NEXT STEPS:', colors.yellow + colors.bright);
    log('\n1. Update these values before running in production:\n');
    logWarning('   JWT_SECRET - Generate: openssl rand -base64 32');
    logWarning('   DB_PASSWORD - Use a strong password');
    logWarning('   POSTGRES_PASSWORD - Use a strong password');
    logWarning('   ALLOWED_ORIGINS - Set your production URLs');
    
    log('\n2. Review and customize other environment variables as needed\n');
    log('📖 For detailed documentation, see: ENVIRONMENT.md\n', colors.cyan);
    log('🚀 Ready to start? Run: docker-compose up --build\n', colors.green);
  } else if (dryRun) {
    log('\n✨ Dry run completed. Run without --dry-run to apply changes.\n', colors.cyan);
  } else if (hasErrors) {
    logError('\n❌ Setup completed with errors. Please check the messages above.\n');
    process.exit(1);
  }
}

// Script'i çalıştır
try {
  main();
} catch (error) {
  logError(`\nUnexpected error: ${error.message}`);
  if (verbose) {
    console.error(error);
  }
  process.exit(1);
}

