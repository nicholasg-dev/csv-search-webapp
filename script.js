// Global variables
let csvData = [];
let dataTable = null;
const DEFAULT_CSV_FILE = 'reports_inventory_listings_assets.csv';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('uploadBtn').addEventListener('click', handleFileUpload);
    document.getElementById('exportBtn').addEventListener('click', exportFilteredData);

    // Automatically load the default CSV file
    loadDefaultCSV();
});

/**
 * Handle the CSV file upload and parsing
 */
function handleFileUpload() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a CSV file first.');
        return;
    }

    // Check if file is a CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a valid CSV file.');
        return;
    }

    // Parse the CSV file
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: function(header) {
            // Keep the original header text but ensure it's a valid property name
            return header.trim();
        },
        complete: function(results) {
            if (results.errors.length > 0) {
                console.error('Error parsing CSV:', results.errors);
                alert('Error parsing CSV file. Please check the console for details.');
                return;
            }

            csvData = results.data;
            displayData(csvData, results.meta.fields);
        }
    });
}

/**
 * Display the CSV data in a table
 * @param {Array} data - The CSV data
 * @param {Array} headers - The CSV headers
 */
function displayData(data, headers) {
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

    // Create table headers
    let headerRow = '<tr>';
    headers.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += '</tr>';
    tableHeader.innerHTML = headerRow;

    // Initialize DataTable if it doesn't exist
    if (dataTable) {
        dataTable.destroy();
    }

    try {
        // Initialize DataTable with the CSV data
        dataTable = new DataTable('#csvDataTable', {
            data: data,
            columns: headers.map((header, index) => ({
                title: header,
                data: function(row, type, set, meta) {
                    // Use array index access instead of property name to avoid issues with special characters
                    return Object.values(row)[index];
                }
            })),
            responsive: true,
            pageLength: 25,
            lengthMenu: [10, 25, 50, 100, 250],
            dom: '<"d-flex justify-content-between align-items-center mb-3"<"d-flex align-items-center"l><"d-flex align-items-center"f>>rtip',
            buttons: [
                {
                    extend: 'copy',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-copy me-1"></i> Copy'
                },
                {
                    extend: 'csv',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-file-csv me-1"></i> CSV'
                },
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-file-excel me-1"></i> Excel'
                },
                {
                    extend: 'pdf',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-file-pdf me-1"></i> PDF'
                },
                {
                    extend: 'print',
                    className: 'btn btn-sm btn-outline-primary',
                    text: '<i class="fas fa-print me-1"></i> Print'
                }
            ],
            language: {
                search: "<i class='fas fa-search'></i>",
                searchPlaceholder: "Search records...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)"
            }
        });

        // Set up search functionality with the global search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', function() {
                dataTable.search(this.value).draw();
            });
        }
    } catch (error) {
        console.error('Error initializing DataTable:', error);
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = `<div class="alert alert-danger" role="alert">Error initializing table: ${error.message}</div>`;
        }
    }
}

/**
 * Load the default CSV file that's included with the application
 */
function loadDefaultCSV() {
    // Make sure the table container exists and is visible
    const tableContainer = document.getElementById('tableContainer');
    if (!tableContainer) {
        console.error('Table container not found');
        return;
    }

    // Remove the d-none class if it exists
    tableContainer.classList.remove('d-none');

    // Show loading indicator or message
    tableContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"></div><p class="mt-3">Loading CSV data...</p></div>';

    // Fetch the CSV file
    fetch(DEFAULT_CSV_FILE)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(csvText => {
            // Parse the CSV data
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                transformHeader: function(header) {
                    // Keep the original header text but ensure it's a valid property name
                    return header.trim();
                },
                complete: function(results) {
                    if (results.errors.length > 0) {
                        console.error('Error parsing CSV:', results.errors);
                        alert('Error parsing CSV file. Please check the console for details.');
                        return;
                    }

                    csvData = results.data;

                    // Recreate the table structure inside the container
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
            console.error('Error loading CSV file:', error);
            tableContainer.innerHTML = `<div class="alert alert-danger" role="alert">Error loading CSV file: ${error.message}</div>`;
        });
}

/**
 * Export the filtered data to CSV
 */
function exportFilteredData() {
    const filteredData = dataTable.rows({ search: 'applied' }).data().toArray();
    const csv = Papa.unparse(filteredData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_data.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
