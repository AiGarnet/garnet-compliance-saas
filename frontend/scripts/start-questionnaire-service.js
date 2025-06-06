const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Configure paths
const rootDir = path.resolve(__dirname, '../..');
const flaskServiceDir = path.join(rootDir, 'flask_questionnaire_service');
const pythonScript = path.join(flaskServiceDir, 'start_service.py');
const logDir = path.join(flaskServiceDir, 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file
const logFile = path.join(logDir, 'service_launcher.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Check if the service is already running
function isServiceRunning(port, callback) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/health',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      callback(false);
    }
  });

  req.on('error', () => {
    callback(false);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });

  req.end();
}

// Find a valid Python interpreter
function findPythonInterpreter(callback) {
  // List of possible Python executable names
  const pythonCommands = ['python', 'python3', 'py'];
  
  // Try each command
  let foundPython = false;
  
  function tryNextCommand(index) {
    if (index >= pythonCommands.length) {
      // None of the commands worked
      callback(null);
      return;
    }
    
    const command = pythonCommands[index];
    
    exec(`${command} --version`, (error, stdout, stderr) => {
      if (!error) {
        // Found a working Python interpreter
        log(`Found Python interpreter: ${command} (${stdout.trim()})`);
        foundPython = true;
        callback(command);
      } else {
        // Try the next command
        tryNextCommand(index + 1);
      }
    });
  }
  
  tryNextCommand(0);
}

// Check and install required Python packages
function installRequirements(pythonCommand, callback) {
  const requirementsPath = path.join(flaskServiceDir, 'requirements.txt');
  
  if (!fs.existsSync(requirementsPath)) {
    log('Requirements file not found. Skipping package installation.');
    callback(true);
    return;
  }
  
  log('Installing required Python packages...');
  
  const pip = spawn(pythonCommand, ['-m', 'pip', 'install', '-r', requirementsPath]);
  
  pip.stdout.on('data', (data) => {
    log(`[pip] ${data.toString().trim()}`);
  });
  
  pip.stderr.on('data', (data) => {
    log(`[pip error] ${data.toString().trim()}`);
  });
  
  pip.on('close', (code) => {
    if (code === 0) {
      log('Required packages installed successfully.');
      callback(true);
    } else {
      log(`Failed to install required packages. Exit code: ${code}`);
      callback(false);
    }
  });
}

// Start the Flask service
function startService(pythonCommand, port, backendUrl) {
  log(`Starting questionnaire service on port ${port} with backend URL: ${backendUrl}`);
  
  // Check if the service is already running
  isServiceRunning(port, (running) => {
    if (running) {
      log(`Questionnaire service is already running at http://localhost:${port}`);
      return;
    }
    
    // Install required packages before starting
    installRequirements(pythonCommand, (success) => {
      if (!success) {
        log('Failed to install required packages. Service may not work correctly.');
        // Continue anyway, as some environments might have the packages installed elsewhere
      }
      
      // Start the service
      const service = spawn(pythonCommand, [pythonScript, '--port', port, '--backend', backendUrl], {
        cwd: flaskServiceDir,
        detached: true, // Run the process in the background
        stdio: ['ignore', 'pipe', 'pipe'] // Redirect stdout and stderr
      });
      
      // Save the PID to a file for later cleanup
      const pidFile = path.join(flaskServiceDir, 'service.pid');
      fs.writeFileSync(pidFile, service.pid.toString());
      
      // Log output
      service.stdout.on('data', (data) => {
        log(`[Service] ${data.toString().trim()}`);
      });
      
      service.stderr.on('data', (data) => {
        log(`[Service Error] ${data.toString().trim()}`);
      });
      
      service.on('close', (code) => {
        log(`Service process exited with code ${code}`);
      });
      
      // Unref the process to allow this script to exit
      service.unref();
      
      // Wait for the service to start
      let attempts = 0;
      const maxAttempts = 10;
      
      function checkServiceStarted() {
        attempts++;
        isServiceRunning(port, (running) => {
          if (running) {
            log(`Questionnaire service started successfully at http://localhost:${port}`);
          } else if (attempts < maxAttempts) {
            log(`Waiting for service to start... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(checkServiceStarted, 1000);
          } else {
            log('Failed to start questionnaire service after multiple attempts.');
          }
        });
      }
      
      // Start checking after a short delay
      setTimeout(checkServiceStarted, 2000);
    });
  });
}

// Main function
function main() {
  log('Starting questionnaire service initialization');
  
  // Configuration
  const port = process.env.QUESTIONNAIRE_SERVICE_PORT || 5001;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
  
  // Find a Python interpreter
  findPythonInterpreter((pythonCommand) => {
    if (!pythonCommand) {
      log('No Python interpreter found. Please install Python 3.x and try again.');
      return;
    }
    
    // Start the service
    startService(pythonCommand, port, backendUrl);
  });
}

// Run the main function
main(); 