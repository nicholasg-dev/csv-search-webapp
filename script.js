/**
 * CSV Search Webapp - Main JavaScript
 *
 * This file contains the core functionality for the CSV Search Webapp.
 * It handles loading CSV data, displaying it in a searchable table,
 * and providing export functionality.
 *
 * The application uses the following libraries:
 * - PapaParse: For parsing CSV files
 * - DataTables: For displaying and interacting with tabular data
 * - Bootstrap: For UI components and styling
 *
 * Security Features:
 * - Honeypot fields to detect and block bots
 * - Timing validation to prevent automated form submissions
 * - Bot detection logging
 * - File validation for uploads
 *
 * User Experience Features:
 * - Column visibility controls
 * - User preference saving
 * - Support for large datasets (up to 2,000 entries per page)
 * - Responsive design for all devices
 *
 * @author Nicholas G
 * @version 1.1.0
 */

//=============================================================================
// GLOBAL VARIABLES AND CONSTANTS
//=============================================================================

/**
 * Stores the parsed CSV data as an array of objects
 * @type {Array}
 */
let csvData = [];

/**
 * Reference to the DataTable instance
 * @type {DataTable|null}
 */
let dataTable = null;

/**
 * Path to the default CSV file that will be loaded on startup
 * Change this value to use a different default CSV file
 * @type {string}
 */
const DEFAULT_CSV_FILE = 'reports_inventory_listings_assets.csv';

//=============================================================================
// INITIALIZATION
//=============================================================================

/**
 * Initialize the application when the DOM is fully loaded
 * Sets up event listeners and loads the default CSV file
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for UI interactions
    document.getElementById('uploadBtn').addEventListener('click', handleFileUpload);
    document.getElementById('exportBtn').addEventListener('click', exportFilteredData);

    // Set up event listener for column visibility modal
    document.getElementById('columnModal').addEventListener('show.bs.modal', populateColumnToggleList);

    // Set up event listeners for select/deselect all columns buttons
    document.getElementById('selectAllColumns').addEventListener('click', function() {
        toggleAllColumns(true);
    });

    document.getElementById('deselectAllColumns').addEventListener('click', function() {
        toggleAllColumns(false);
    });

    // Set up event listener to set timestamp when upload modal is shown
    // This timestamp is used to detect if the form is submitted too quickly (bot behavior)
    document.getElementById('uploadModal').addEventListener('show.bs.modal', function() {
        const timestampField = document.getElementById('formTimestamp');
        if (timestampField) {
            // Store the current timestamp in milliseconds since epoch
            timestampField.value = Date.now().toString();
        }
    });

    // Set up event listener to clear honeypot field when upload modal is closed
    // This prevents accidental filling of the honeypot by legitimate users
    document.getElementById('uploadModal').addEventListener('hidden.bs.modal', function() {
        const honeypotField = document.getElementById('website');
        if (honeypotField) {
            // Reset the honeypot field to empty
            honeypotField.value = '';
        }
    });

    // Automatically load the default CSV file when the page loads
    loadDefaultCSV();
});

//=============================================================================
// FILE HANDLING FUNCTIONS
//=============================================================================

/**
 * Handle the CSV file upload and parsing
 * This function is called when the user clicks the "Load Data" button in the upload modal
 * It reads the selected file, validates it, and parses it using PapaParse
 *
 * Security measures implemented:
 * 1. Honeypot validation - detects if bots have filled hidden fields
 * 2. Timing validation - detects if the form was submitted too quickly to be human
 * 3. File validation - checks file size and type
 */
const handleFileUpload = async () => {
    try {
        // =====================================================================
        // SECURITY CHECK 1: HONEYPOT VALIDATION
        // =====================================================================
        // Honeypot fields are invisible to humans but visible to bots
        // If this field contains any value, it was likely filled by a bot
        const honeypotField = document.getElementById('website');
        if (honeypotField && honeypotField.value) {
            // Log the bot attempt with details for analysis
            logBotAttempt('Honeypot field was filled', {
                honeypotValue: honeypotField.value
            });

            // Important: Don't tell the bot it was detected
            // Instead, return a generic error that looks like a normal failure
            // This prevents bots from learning how to bypass our protection
            showError('Upload failed: Invalid file format');
            return;
        }

        // =====================================================================
        // SECURITY CHECK 2: TIMING VALIDATION
        // =====================================================================
        // Check how quickly the form was submitted after being opened
        // Humans take time to select a file and click submit
        // Bots often submit forms instantly or very quickly
        const timestampField = document.getElementById('formTimestamp');
        if (timestampField && timestampField.value) {
            // Calculate time elapsed since the form was opened
            const formOpenTime = parseInt(timestampField.value, 10);
            const currentTime = Date.now();
            const timeDifference = currentTime - formOpenTime;

            // Threshold of 1.5 seconds - adjust as needed for your use case
            // Most humans take at least this long to select a file and submit
            if (timeDifference < 1500) {
                logBotAttempt('Form submitted too quickly', {
                    timeDifference: timeDifference,
                    threshold: 1500
                });

                // Again, use a generic error message
                showError('Upload failed: Please try again');
                return;
            }
        }

        // =====================================================================
        // SECURITY CHECK 3: FILE VALIDATION
        // =====================================================================
        // Get the selected file from the file input
        const file = document.getElementById('csvFileInput').files[0];
        if (!file) throw new Error('No file selected');

        // File size validation - prevent denial of service attacks with huge files
        // 50MB is a generous limit for CSV files - adjust based on your needs
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 50MB limit');
        }

        // File type validation - ensure only CSV files are processed
        // This helps prevent malicious file uploads and execution
        if (!file.type && !file.name.endsWith('.csv')) {
            throw new Error('Invalid file type. Please upload a CSV file');
        }

        // Parse the CSV file using PapaParse library
        Papa.parse(file, {
            header: true,              // Treat the first row as headers
            dynamicTyping: true,       // Automatically convert numeric values
            skipEmptyLines: true,      // Skip empty lines in the CSV
            transformHeader: function(header) {
                // Clean up header names by trimming whitespace
                return header.trim();
            },
            // Callback function when parsing is complete
            complete: function(results) {
                // Check for parsing errors
                if (results.errors.length > 0) {
                    console.error('Error parsing CSV:', results.errors);
                    alert('Error parsing CSV file. Please check the console for details.');
                    return;
                }

                // Store the parsed data in the global variable
                csvData = results.data;

                // Display the data in the table
                displayData(csvData, results.meta.fields);
            }
        });
    } catch (error) {
        showError(`Upload failed: ${error.message}`);
    }
};

/**
 * Display an error message to the user
 * @param {string} message - The error message to display
 */
const showError = (message) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').prepend(alertDiv);
};

/**
 * Log a bot attempt to the console and potentially to a server
 * This function centralizes all bot detection logging for consistency and easier management
 *
 * In a production environment, you would want to send these logs to your server
 * for analysis and to potentially block repeat offenders by IP or other identifiers
 *
 * @param {string} reason - The reason the bot was detected (e.g., 'honeypot filled', 'timing')
 * @param {Object} data - Additional data about the bot attempt for analysis
 */
const logBotAttempt = (reason, data = {}) => {
    // Create a comprehensive log data object with useful information for analysis
    const logData = {
        // ISO timestamp for standardized logging
        timestamp: new Date().toISOString(),

        // The detection reason helps categorize bot attempts
        reason: reason,

        // User agent can help identify bot patterns
        userAgent: navigator.userAgent,

        // Page URL where the attempt occurred
        url: window.location.href,

        // Include any additional data passed to the function
        ...data
    };

    // Log to console for development and testing
    console.warn(`Bot detected: ${reason}`, logData);

    // In a production environment, you would send this to your server
    // Uncomment and configure the fetch call below in production
    /*
    fetch('/api/security/log-bot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
    }).catch(err => console.error('Failed to log bot attempt:', err));
    */

    // You could also store bot attempts in localStorage to track repeat offenders
    // This is optional and depends on your security needs
    /*
    try {
        const botAttempts = JSON.parse(localStorage.getItem('botAttempts') || '[]');
        botAttempts.push(logData);
        localStorage.setItem('botAttempts', JSON.stringify(botAttempts.slice(-10))); // Keep last 10
    } catch (e) {
        console.error('Failed to store bot attempt in localStorage', e);
    }
    */
};

//=============================================================================
// DATA DISPLAY FUNCTIONS
//=============================================================================

/**
 * Display the CSV data in a table using DataTables
 * This function creates the table headers and initializes the DataTable with the CSV data
 *
 * @param {Array} data - The CSV data as an array of objects
 * @param {Array} headers - The CSV headers as an array of strings
 */
function displayData(data, headers) {
    // Validate that the data array is not empty
    if (data.length === 0) {
        alert('No data found in the CSV file.');
        return;
    }

    // Get the table header element
    const tableHeader = document.getElementById('tableHeader');
    if (!tableHeader) {
        console.error('Table header element not found');
        return;
    }

    // Create table headers from the CSV headers
    let headerRow = '<tr>';
    headers.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += '</tr>';
    tableHeader.innerHTML = headerRow;

    // If a DataTable already exists, destroy it before creating a new one
    if (dataTable) {
        dataTable.destroy();
    }

    try {
        // Initialize DataTable with the CSV data
        dataTable = $('#csvDataTable').DataTable({
            // Data configuration
            data: data,                          // The CSV data
            columns: headers.map((header, index) => ({
                title: header,                   // Column title
                data: function(row) {
                    // Use array index access instead of property name to avoid issues with special characters
                    // This is important for column names with spaces or special characters
                    // Note: DataTables normally passes (row, type, set, meta) parameters, but we only need row
                    return Object.values(row)[index];
                }
            })),

            // Table configuration
            responsive: true,                    // Make table responsive to screen size
            pageLength: 25,                      // Number of rows per page
            lengthMenu: [
                [10, 25, 50, 100, 250, 1000, 1500, 2000],  // Values
                [10, 25, 50, 100, 250, '1,000', '1,500', '2,000']  // Display labels with commas for readability
            ],

            // DOM structure for DataTables elements
            // This defines where the length selector, filter, table, info, and pagination appear
            dom: '<"d-flex justify-content-between align-items-center mb-3"<"d-flex align-items-center"l><"d-flex align-items-center"f>>rtip',

            // Export buttons configuration
            buttons: [
                // Copy button
                {
                    extend: 'copy',                                  // Button type
                    className: 'btn btn-sm btn-outline-primary',      // Bootstrap styling
                    text: '<i class="fas fa-copy me-1"></i> Copy'    // Button text with icon
                },
                // CSV export button
                {
                    extend: 'csv',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-file-csv me-1"></i> CSV'
                },
                // Excel export button
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-file-excel me-1"></i> Excel'
                },
                // PDF export button
                {
                    extend: 'pdf',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-file-pdf me-1"></i> PDF'
                },
                // Print button
                {
                    extend: 'print',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-print me-1"></i> Print'
                }
            ],

            // Custom language/text for DataTables elements
            language: {
                search: "<i class='fas fa-search'></i>",              // Search icon
                searchPlaceholder: "Search records...",               // Search placeholder
                lengthMenu: "Show _MENU_ entries",                    // Length menu text
                info: "Showing _START_ to _END_ of _TOTAL_ entries", // Info text
                infoEmpty: "Showing 0 to 0 of 0 entries",            // Empty info text
                infoFiltered: "(filtered from _MAX_ total entries)"   // Filtered info text
            }
        });

        // Set up search functionality with the global search input
        // This connects the search box at the top of the page to the DataTable search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', function() {
                dataTable.search(this.value).draw();
            });
        }

        // Load user preferences (column visibility, page length, etc.)
        loadPreferences();

        // Add event listener to save preferences when user changes page length
        document.querySelector('.dataTables_length select').addEventListener('change', savePreferences);

        // Add event listener to save preferences when user sorts columns
        document.querySelector('#csvDataTable').addEventListener('order.dt', savePreferences);
    } catch (error) {
        // Handle any errors that occur during DataTable initialization
        console.error('Error initializing DataTable:', error);
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = `<div class="alert alert-danger" role="alert">Error initializing table: ${error.message}</div>`;
        }
    }
}

/**
 * Load the default CSV file that's included with the application
 * This function is called automatically when the page loads
 * It fetches the CSV file, parses it, and displays the data in the table
 */
function loadDefaultCSV() {
    // Make sure the table container exists and is visible
    const tableContainer = document.getElementById('tableContainer');
    if (!tableContainer) {
        console.error('Table container not found');
        return;
    }

    // Remove the d-none class if it exists to make the container visible
    tableContainer.classList.remove('d-none');

    // Show loading indicator while the CSV file is being fetched and parsed
    tableContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"></div><p class="mt-3">Loading CSV data...</p></div>';

    // Fetch the CSV file using the Fetch API
    fetch(DEFAULT_CSV_FILE)
        .then(response => {
            // Check if the fetch was successful
            if (!response.ok) {
                throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
            }
            // Convert the response to text
            return response.text();
        })
        .then(csvText => {
            // Parse the CSV text using PapaParse
            Papa.parse(csvText, {
                header: true,              // Treat the first row as headers
                dynamicTyping: true,       // Automatically convert numeric values
                skipEmptyLines: true,      // Skip empty lines in the CSV
                transformHeader: function(header) {
                    // Clean up header names by trimming whitespace
                    return header.trim();
                },
                // Callback function when parsing is complete
                complete: function(results) {
                    // Check for parsing errors
                    if (results.errors.length > 0) {
                        console.error('Error parsing CSV:', results.errors);
                        alert('Error parsing CSV file. Please check the console for details.');
                        return;
                    }

                    // Store the parsed data in the global variable
                    csvData = results.data;

                    // Recreate the table structure inside the container
                    // This includes the table header, info message, and table element
                    tableContainer.innerHTML = `
                        <div class="card-header bg-light">
                            <h5 class="mb-0"><i class="fas fa-table me-2"></i>Data Table</h5>
                        </div>
                        <div class="card-body table-responsive">
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle me-2"></i>Loaded ${csvData.length.toLocaleString()} records from the CSV file.
                            </div>
                            <table id="csvDataTable" class="table table-striped table-hover">
                                <thead id="tableHeader"></thead>
                                <tbody id="tableBody"></tbody>
                            </table>
                        </div>
                    `;

                    // Now display the data in the recreated table
                    displayData(csvData, results.meta.fields);
                }
            });
        })
        .catch(error => {
            // Handle any errors that occur during fetch or parsing
            console.error('Error loading CSV file:', error);
            tableContainer.innerHTML = `<div class="alert alert-danger" role="alert">Error loading CSV file: ${error.message}</div>`;
        });
}

//=============================================================================
// EXPORT FUNCTIONS
//=============================================================================

/**
 * Export the filtered data to CSV
 * This function is called when the user clicks the "Export" button
 * It gets the currently filtered data from the DataTable and downloads it as a CSV file
 */
function exportFilteredData() {
    // Get the filtered data from the DataTable
    // This includes only the rows that match the current search/filter
    const filteredData = dataTable.rows({ search: 'applied' }).data().toArray();

    // Convert the data back to CSV format using PapaParse
    const csv = Papa.unparse(filteredData);

    // Create a Blob containing the CSV data
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // Create a temporary link element to trigger the download
    const link = document.createElement('a');

    // Set the link's properties for downloading
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_data.csv'); // Default filename for the download
    link.style.visibility = 'hidden'; // Hide the link

    // Add the link to the document, click it to trigger the download, then remove it
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up

    // Release the URL object to free up memory
    URL.revokeObjectURL(url);
}

// Add lazy loading for large datasets
const loadData = async (data) => {
    const CHUNK_SIZE = 1000;
    let currentIndex = 0;

    while (currentIndex < data.length) {
        const chunk = data.slice(currentIndex, currentIndex + CHUNK_SIZE);
        await new Promise(resolve => setTimeout(resolve, 0));
        dataTable.rows.add(chunk);
        currentIndex += CHUNK_SIZE;
    }
    dataTable.draw();
};

/**
 * Populates the column toggle list in the column visibility modal
 * This function is called when the column visibility modal is shown
 *
 * It dynamically creates toggle switches for each column in the DataTable
 * allowing users to show/hide specific columns based on their needs.
 * The current visibility state is reflected in the toggle switches.
 */
function populateColumnToggleList() {
    // Make sure the DataTable exists before proceeding
    if (!dataTable) {
        console.error('DataTable not initialized');
        return;
    }

    // Get the column toggle list container from the DOM
    const columnToggleList = document.getElementById('columnToggleList');
    if (!columnToggleList) {
        console.error('Column toggle list container not found');
        return;
    }

    // Clear any existing toggle switches to prevent duplicates
    columnToggleList.innerHTML = '';

    // Get all columns from the DataTable
    const columns = dataTable.columns();
    const columnCount = columns.data().length;

    // Create a toggle switch for each column in the table
    for (let i = 0; i < columnCount; i++) {
        // Get the column header text to display as the label
        const columnHeader = dataTable.column(i).header();
        const columnName = columnHeader ? columnHeader.textContent : `Column ${i+1}`;

        // Get the current visibility state to set the initial toggle position
        const isVisible = dataTable.column(i).visible();

        // Create a list item with a Bootstrap toggle switch
        // The switch is linked to the column index for easy reference
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
            <span>${columnName}</span>
            <div class="form-check form-switch">
                <input class="form-check-input column-toggle" type="checkbox"
                       data-column="${i}" id="column-toggle-${i}" ${isVisible ? 'checked' : ''}>
            </div>
        `;

        // Add the list item to the container
        columnToggleList.appendChild(listItem);
    }

    // Add event listeners to all toggle switches
    // This allows immediate visibility changes when a switch is toggled
    const toggles = document.querySelectorAll('.column-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            // Get the column index and new visibility state
            const columnIndex = this.getAttribute('data-column');
            const isVisible = this.checked;

            // Update the DataTable column visibility
            dataTable.column(columnIndex).visible(isVisible);

            // Save the updated preferences to localStorage
            // This ensures the user's column visibility preferences persist across sessions
            savePreferences();
        });
    });
}

/**
 * Toggle visibility of all columns at once
 * This is a convenience function that allows users to quickly show or hide all columns
 * with a single click, rather than toggling each column individually.
 *
 * @param {boolean} visible - Whether to show (true) or hide (false) all columns
 */
function toggleAllColumns(visible) {
    // Make sure the DataTable exists before proceeding
    if (!dataTable) {
        console.error('DataTable not initialized');
        return;
    }

    // Toggle all columns in the DataTable to the specified visibility
    // This uses DataTables' built-in columns().visible() method
    dataTable.columns().visible(visible);

    // Update all toggle switches in the modal to match the new visibility state
    // This ensures the UI stays in sync with the actual column visibility
    const toggles = document.querySelectorAll('.column-toggle');
    toggles.forEach(toggle => {
        toggle.checked = visible;
    });

    // Save the updated preferences to localStorage
    // This ensures the user's column visibility preferences persist across sessions
    savePreferences();
}

/**
 * Save user preferences to localStorage
 * This function stores the user's customizations so they persist across page reloads
 * and browser sessions. This improves user experience by remembering their preferred
 * settings.
 *
 * Saved preferences include:
 * - Page length (number of entries shown per page)
 * - Column visibility settings (which columns are shown/hidden)
 * - Sort order (which column is sorted and in what direction)
 */
const savePreferences = () => {
    // Only proceed if the DataTable has been initialized
    if (!dataTable) return;

    // Create an object containing all user preferences
    const preferences = {
        // Number of entries shown per page (10, 25, 50, etc.)
        pageLength: dataTable.page.len(),

        // Array of boolean values indicating visibility of each column
        visibleColumns: dataTable.columns().visible().toArray(),

        // Current sort order (column index and direction)
        sortOrder: dataTable.order()
    };

    // Save the preferences object to localStorage as a JSON string
    localStorage.setItem('csvWebappPreferences', JSON.stringify(preferences));
};

/**
 * Load user preferences from localStorage
 * This function retrieves and applies the user's previously saved preferences
 * when the DataTable is initialized. This creates a consistent experience
 * across sessions.
 *
 * If no preferences are found or if there's an error, default settings are used.
 */
const loadPreferences = () => {
    // Only proceed if the DataTable has been initialized
    if (!dataTable) return;

    // Try to retrieve saved preferences from localStorage
    const saved = localStorage.getItem('csvWebappPreferences');
    if (saved) {
        try {
            // Parse the JSON string back into an object
            const preferences = JSON.parse(saved);

            // Apply the saved page length (number of entries per page)
            if (preferences.pageLength) {
                dataTable.page.len(preferences.pageLength).draw();
            }

            // Apply the saved column visibility settings
            if (preferences.visibleColumns && Array.isArray(preferences.visibleColumns)) {
                preferences.visibleColumns.forEach((visible, index) => {
                    // Make sure the column index is valid for the current table
                    if (index < dataTable.columns().data().length) {
                        dataTable.column(index).visible(visible);
                    }
                });
            }

            // Apply the saved sort order
            if (preferences.sortOrder && Array.isArray(preferences.sortOrder)) {
                dataTable.order(preferences.sortOrder).draw();
            }
        } catch (error) {
            // Log any errors but don't disrupt the user experience
            console.error('Error loading preferences:', error);
            // Default settings will be used if preferences can't be loaded
        }
    }
};
