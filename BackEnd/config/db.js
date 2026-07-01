const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial JSON Database Structure
const initialData = {
  users: [],
  expenses: [],
  goals: [],
  quizHistory: [],
  portfolio: []
};

// Reads the DB from disk
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(initialData);
      return initialData;
    }
    const fileContent = fs.readFileSync(DB_PATH, 'utf8');
    if (!fileContent.trim()) {
      writeDB(initialData);
      return initialData;
    }
    return JSON.parse(fileContent);
  } catch (err) {
    console.error("Error reading database file, resetting to empty:", err);
    return initialData;
  }
}

// Writes the DB back to disk synchronously to avoid race conditions
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

const db = {
  // Retrieve raw collection arrays
  getCollection: (name) => {
    const data = readDB();
    return data[name] || [];
  },

  // Save raw collection arrays back
  saveCollection: (name, collection) => {
    const data = readDB();
    data[name] = collection;
    writeDB(data);
  },

  // Find all items matching a query filter
  find: (collectionName, query = {}) => {
    const collection = db.getCollection(collectionName);
    return collection.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Find a single item matching a query filter
  findOne: (collectionName, query = {}) => {
    const collection = db.getCollection(collectionName);
    return collection.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Insert a new record
  create: (collectionName, itemData) => {
    const collection = db.getCollection(collectionName);
    const newItem = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      ...itemData
    };
    collection.push(newItem);
    db.saveCollection(collectionName, collection);
    return newItem;
  },

  // Update records matching a query filter
  update: (collectionName, query = {}, updates = {}) => {
    const collection = db.getCollection(collectionName);
    let updatedCount = 0;
    const updatedCollection = collection.map(item => {
      let match = true;
      for (let key in query) {
        if (item[key] !== query[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        updatedCount++;
        return {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    if (updatedCount > 0) {
      db.saveCollection(collectionName, updatedCollection);
    }
    return updatedCount;
  },

  // Delete records matching a query filter
  delete: (collectionName, query = {}) => {
    const collection = db.getCollection(collectionName);
    const initialLen = collection.length;
    const filteredCollection = collection.filter(item => {
      let match = true;
      for (let key in query) {
        if (item[key] !== query[key]) {
          match = false;
          break;
        }
      }
      return !match;
    });
    const deletedCount = initialLen - filteredCollection.length;
    if (deletedCount > 0) {
      db.saveCollection(collectionName, filteredCollection);
    }
    return deletedCount;
  }
};

module.exports = db;
