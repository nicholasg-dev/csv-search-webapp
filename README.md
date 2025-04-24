# CSV Search Webapp

A modern, client-side web application that allows users to upload and search through CSV data with advanced filtering, sorting, and export capabilities. The application automatically loads a default CSV file on startup and provides a rich, interactive interface for data exploration.

![CSV Search Webapp Screenshot](https://via.placeholder.com/800x450.png?text=CSV+Search+Webapp)

## Features

- **Automatic CSV Loading**: Automatically loads a default CSV file on startup
- **File Upload**: Upload and parse custom CSV files
- **Advanced Search**: Real-time search across all columns
- **Sorting**: Sort data by clicking on column headers
- **Pagination**: Navigate through large datasets with ease
- **Export Options**: Export filtered data to CSV, Excel, PDF formats
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with Bootstrap 5
- **Client-Side Processing**: Fast data handling with no server-side processing
- **Special Character Support**: Handles CSV files with special characters and spaces in column names

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed on your system.
2. Clone or download this repository:
   ```bash
   git clone https://github.com/nicholasg-dev/csv-search-webapp.git
   ```
3. Navigate to the project directory in your terminal:
   ```bash
   cd csv-search-webapp
   ```
4. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   node server.js
   ```
   Or use npm if you prefer:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`.

3. The application will automatically load the default CSV file (`reports_inventory_listings_assets.csv`).

4. To search the data:
   - Use the search box at the top of the page to filter across all columns
   - Click on column headers to sort the data
   - Use the pagination controls to navigate through the data

5. To upload a different CSV file:
   - Click the "Upload CSV" button in the navigation bar
   - Select your CSV file and click "Load Data"

6. To export the data:
   - Click the "Export" button in the navigation bar
   - Choose your preferred format (CSV, Excel, PDF, etc.)

## Technical Architecture

### Frontend

- **HTML5**: Semantic markup for structure
- **CSS3**: Custom styling with flexbox and grid layouts
- **JavaScript (ES6+)**: Client-side functionality
- **Bootstrap 5**: Responsive design framework
- **jQuery**: DOM manipulation and event handling
- **DataTables**: Advanced table functionality
- **PapaParse**: CSV parsing library
- **Font Awesome**: Icon library

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Lightweight web server framework

### Data Flow

1. **CSV Loading**: The application loads a CSV file either automatically on startup or through user upload
2. **Parsing**: PapaParse converts the CSV data into a JavaScript array of objects
3. **Display**: DataTables renders the data in a searchable, sortable table
4. **Interaction**: Users can search, sort, and export the data
5. **Export**: DataTables provides export functionality to various formats

## Project Structure

```
csv-search-webapp/
├── index.html          # Main HTML file with the application structure
├── styles.css          # Custom CSS styles
├── script.js           # Client-side JavaScript functionality
├── server.js           # Express server for serving the application
├── package.json        # Node.js dependencies and scripts
├── package-lock.json   # Locked versions of dependencies
├── reports_inventory_listings_assets.csv  # Default CSV file
└── README.md           # Project documentation
```

## Customization

### Adding a Different Default CSV File

1. Replace the `reports_inventory_listings_assets.csv` file with your own CSV file
2. Update the `DEFAULT_CSV_FILE` constant in `script.js` to match your filename

### Modifying the UI

- **Layout**: Edit the HTML structure in `index.html`
- **Styling**: Customize the appearance in `styles.css`
- **Behavior**: Modify the functionality in `script.js`

### Extending Functionality

- **Add Authentication**: Implement user authentication for restricted access
- **Server-Side Processing**: Modify `server.js` to handle large datasets on the server
- **Database Integration**: Connect to a database for persistent storage

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgements

- [Bootstrap](https://getbootstrap.com/)
- [DataTables](https://datatables.net/)
- [PapaParse](https://www.papaparse.com/)
- [Font Awesome](https://fontawesome.com/)
- [Express](https://expressjs.com/)
