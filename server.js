const http = require('http'); 
const fs = require('fs').promises; // Use promises for async I/O
const url = require('url');
const DATA = 'items.json';

// Function to read items from the file
async function readItems() {
    const data = await fs.readFile(DATA, 'utf-8');
    return JSON.parse(data);
}

// Function to write items to the file
async function writeItems(items) {
    await fs.writeFile(DATA, JSON.stringify(items, null, 2));
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Set header content type
    res.setHeader('Content-Type', 'application/json');

    try {
        // Handle GET requests
        if (req.method === 'GET') {
            if (pathname === '/items') {
                // Return all items
                const items = await readItems();
                res.statusCode = 200;
                res.end(JSON.stringify(items));
            } else if (pathname.startsWith('/items/')) {
                // Return a specific item by ID
                const id = parseInt(pathname.split('/')[2], 10);
                const items = await readItems();
                const item = items.find(i => i.id === id);
                if (item) {
                    res.statusCode = 200;
                    res.end(JSON.stringify(item));
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ message: 'Item Not Found' }));
                }
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ message: 'Not Found' }));
            }
        }

        // Handle POST requests
        else if (req.method === 'POST' && pathname === '/items') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // Convert Buffer to string
            });
            req.on('end', async () => {
                const newItem = JSON.parse(body);
                const items = await readItems();
                newItem.id = items.length ? items[items.length - 1].id + 1 : 1; // Auto-increment id
                items.push(newItem);
                await writeItems(items);
                res.statusCode = 201; // Created
                res.end(JSON.stringify(newItem));
            });
        }

        // Handle PUT requests
        else if (req.method === 'PUT' && pathname.startsWith('/items/')) {
            const id = parseInt(pathname.split('/')[2], 10);
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                const updatedItem = JSON.parse(body);
                const items = await readItems();
                const index = items.findIndex(i => i.id === id);
                if (index !== -1) {
                    updatedItem.id = id; // Maintain the same id
                    items[index] = updatedItem;
                    await writeItems(items);
                    res.statusCode = 200; // OK
                    res.end(JSON.stringify(updatedItem));
                } else {
                    res.statusCode = 404; // Not Found
                    res.end(JSON.stringify({ message: 'Item Not Found' }));
                }
            });
        }

        // Handle DELETE requests
        else if (req.method === 'DELETE' && pathname.startsWith('/items/')) {
            const id = parseInt(pathname.split('/')[2], 10);
            const items = await readItems();
            const index = items.findIndex(i => i.id === id);
            if (index !== -1) {
                items.splice(index, 1);
                await writeItems(items);
                res.statusCode = 204; // No Content
                res.end();
            } else {
                res.statusCode = 404; // Not Found
                res.end(JSON.stringify({ message: 'Item Not Found' }));
            }
        }

        // Handle unknown methods
        else {
            res.statusCode = 405; // Method Not Allowed
            res.end(JSON.stringify({ message: 'Method Not Allowed' }));
        }
    } catch (error) {
        res.statusCode = 500; // Internal Server Error
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }
});

// Start the server
server.listen(3000, 'localhost', () => {
    console.log('Listening for requests on http://localhost:3000');
});