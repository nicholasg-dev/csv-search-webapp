/**
 * CSV Search Webapp - Server
 *
 * This is a simple Express server that serves the static files for the CSV Search Webapp.
 * The application is primarily client-side, with this server only responsible for
 * delivering the static assets (HTML, CSS, JavaScript) to the client.
 *
 * @author Nicholas G
 * @version 1.0.0
 */

// Import required modules
const express = require('express'); // Express web framework
const path = require('path');       // Node.js path module for working with file paths
const app = express();              // Create an Express application

// Set the port for the server to listen on
// Use the PORT environment variable if available, otherwise use port 3000
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 */

// Serve static files from the current directory
// This allows the client to access all files in the project directory
// including HTML, CSS, JavaScript, and CSV files
app.use(express.static(__dirname));

/**
 * Route Definitions
 */

// Route for the home page
// When a user navigates to the root URL, send the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * Server Initialization
 */

// Start the server and listen on the specified port
app.listen(PORT, () => {
    // Log server startup information to the console
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT} to use the CSV Search Webapp`);
});

/**
 * Note: This server does not handle any data processing.
 * All CSV parsing and data manipulation happens on the client-side
 * using JavaScript libraries like PapaParse and DataTables.
 */
