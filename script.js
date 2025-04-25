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
 * @author Nicholas G
 * @version 1.0.0
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
 */
const handleFileUpload = async () => {
    try {
        const file = document.getElementById('csvFileInput').files[0];
        if (!file) throw new Error('No file selected');

        // Add file size validation
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size exceeds 50MB limit');
        }

        // Add file type validation
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

const showError = (message) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').prepend(alertDiv);
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
                data: function(row, type, set, meta) {
                    // Use array index access instead of property name to avoid issues with special characters
                    // This is important for column names with spaces or special characters
                    return Object.values(row)[index];
                }
            })),

            // Table configuration
            responsive: true,                    // Make table responsive to screen size
            pageLength: 25,                      // Number of rows per page
            lengthMenu: [10, 25, 50, 100, 250],  // Options for rows per page

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
 */
function populateColumnToggleList() {
    // Make sure the DataTable exists
    if (!dataTable) {
        console.error('DataTable not initialized');
        return;
    }

    // Get the column toggle list container
    const columnToggleList = document.getElementById('columnToggleList');
    if (!columnToggleList) {
        console.error('Column toggle list container not found');
        return;
    }

    // Clear the existing list
    columnToggleList.innerHTML = '';

    // Get all columns from the DataTable
    const columns = dataTable.columns();
    const columnCount = columns.data().length;

    // Create a toggle button for each column
    for (let i = 0; i < columnCount; i++) {
        // Get the column header text
        const columnHeader = dataTable.column(i).header();
        const columnName = columnHeader ? columnHeader.textContent : `Column ${i+1}`;

        // Get the current visibility state
        const isVisible = dataTable.column(i).visible();

        // Create a list item with a toggle switch
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

    // Add event listeners to the toggle switches
    const toggles = document.querySelectorAll('.column-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const columnIndex = this.getAttribute('data-column');
            const isVisible = this.checked;

            // Toggle the column visibility
            dataTable.column(columnIndex).visible(isVisible);

            // Save the updated preferences
            savePreferences();
        });
    });
}

/**
 * Toggle visibility of all columns
 * @param {boolean} visible - Whether to show (true) or hide (false) all columns
 */
function toggleAllColumns(visible) {
    // Make sure the DataTable exists
    if (!dataTable) {
        console.error('DataTable not initialized');
        return;
    }

    // Toggle all columns in the DataTable
    dataTable.columns().visible(visible);

    // Update all toggle switches in the modal
    const toggles = document.querySelectorAll('.column-toggle');
    toggles.forEach(toggle => {
        toggle.checked = visible;
    });

    // Save the updated preferences
    savePreferences();
}

/**
 * Save user preferences to localStorage
 * This includes page length, visible columns, and sort order
 */
const savePreferences = () => {
    if (!dataTable) return;

    const preferences = {
        pageLength: dataTable.page.len(),
        visibleColumns: dataTable.columns().visible().toArray(),
        sortOrder: dataTable.order()
    };
    localStorage.setItem('csvWebappPreferences', JSON.stringify(preferences));
};

/**
 * Load user preferences from localStorage
 * This includes page length, visible columns, and sort order
 */
const loadPreferences = () => {
    if (!dataTable) return;

    const saved = localStorage.getItem('csvWebappPreferences');
    if (saved) {
        try {
            const preferences = JSON.parse(saved);

            // Set page length
            if (preferences.pageLength) {
                dataTable.page.len(preferences.pageLength).draw();
            }

            // Set column visibility
            if (preferences.visibleColumns && Array.isArray(preferences.visibleColumns)) {
                preferences.visibleColumns.forEach((visible, index) => {
                    if (index < dataTable.columns().data().length) {
                        dataTable.column(index).visible(visible);
                    }
                });
            }

            // Set sort order
            if (preferences.sortOrder && Array.isArray(preferences.sortOrder)) {
                dataTable.order(preferences.sortOrder).draw();
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }
};
