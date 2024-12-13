import Papa from 'papaparse';

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
  try {
    const { csvUrl } = e.data;
    
    // Fetch the CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse the CSV data with optimized settings
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true, // Automatically convert numeric values
      fastMode: true, // Faster parsing for clean CSV
      chunk: (results, parser) => {
        // Process data in chunks
        self.postMessage({
          type: 'chunk',
          data: results.data
        });
      },
      complete: () => {
        self.postMessage({
          type: 'complete'
        });
      },
      error: (error) => {
        self.postMessage({
          type: 'error',
          error: 'Failed to parse CSV data: ' + error.message
        });
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: 'Failed to load data: ' + error.message
    });
  }
});
