# CSV Search Webapp

A web application that allows users to upload CSV files and search through the data with advanced filtering capabilities.

## Features

- Upload and parse CSV files
- Display data in a searchable, sortable table
- Filter data with real-time search
- Pagination for large datasets
- Responsive design for mobile compatibility

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed on your system.
2. Clone or download this repository.
3. Navigate to the project directory in your terminal.
4. Install the dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`.
3. Upload your CSV file using the file input.
4. Click the "Load Data" button to parse and display the data.
5. Use the search box to filter the data.
6. Click on column headers to sort the data.

## How It Works

- The application uses [PapaParse](https://www.papaparse.com/) to parse CSV files on the client-side.
- [DataTables](https://datatables.net/) is used to provide advanced table functionality like searching, sorting, and pagination.
- The interface is built with [Bootstrap](https://getbootstrap.com/) for responsive design.
- A simple Express server is used to serve the static files.

## Customization

You can customize the appearance and behavior of the application by modifying the following files:

- `styles.css` - Custom CSS styles
- `script.js` - JavaScript functionality
- `index.html` - HTML structure

## License

This project is open source and available under the MIT License.
