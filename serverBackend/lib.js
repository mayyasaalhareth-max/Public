const fs = require("fs");
const path = require("path");
const http = require("http");
const Base = require("./Base");

class JsonRepository {
  constructor(filePath, collectionName) {
    if (!filePath) {
      throw new Error("filePath is required");
    }

    this.filePath = filePath;
    this.collectionName = collectionName;
    this.ensureFile();
  }

  ensureFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ users: [], task: [] }, null, 2),
        "utf-8",
      );
    }

    const data = this.readData();
    if (!data[this.collectionName]) {
      data[this.collectionName] = [];
      this.writeData(data);
    }
  }

  readData() {
    const raw = fs.readFileSync(this.filePath, "utf-8");
    return JSON.parse(raw);
  }

  writeData(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async create(data) {
    const db = this.readData();
    const collection = db[this.collectionName] || [];

    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...data,
    };

    collection.push(newItem);
    db[this.collectionName] = collection;
    this.writeData(db);

    return newItem;
  }

  async findAll() {
    const db = this.readData();
    return db[this.collectionName] || [];
  }

  async findById(id) {
    const db = this.readData();
    const collection = db[this.collectionName] || [];
    return collection.find((item) => item.id === Number(id)) || null;
  }

  async update(id, data) {
    const db = this.readData();
    const collection = db[this.collectionName] || [];
    const index = collection.findIndex((item) => item.id === Number(id));

    if (index === -1) {
      return null;
    }

    collection[index] = { ...collection[index], ...data };
    db[this.collectionName] = collection;
    this.writeData(db);

    return collection[index];
  }

  async delete(id) {
    const db = this.readData();
    const collection = db[this.collectionName] || [];
    const index = collection.findIndex((item) => item.id === Number(id));

    if (index === -1) {
      return null;
    }

    const [deletedItem] = collection.splice(index, 1);
    db[this.collectionName] = collection;
    this.writeData(db);

    return deletedItem;
  }
}

const dbPath = path.join(__dirname, "database.json");
const userRepository = new JsonRepository(dbPath, "users");
const taskRepository = new JsonRepository(dbPath, "task");

const userBase = new Base(userRepository);
const taskBase = new Base(taskRepository);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, "http://localhost:3000");
  const pathParts = url.pathname.split("/").filter(Boolean);
  const resource = pathParts[0];
  const id = pathParts[1] ? Number(pathParts[1]) : null;

  const repo = resource === "users" ? userBase : taskBase;

  if (!resource || (resource !== "users" && resource !== "task")) {
    sendJson(res, 404, { message: "Route not found" });
    return;
  }

  try {
    if (req.method === "GET" && !id) {
      const items = await repo.findAll();
      sendJson(res, 200, items);
      return;
    }

    if (req.method === "GET" && id) {
      const item = await repo.findById(id);
      if (!item) {
        sendJson(res, 404, { message: "Item not found" });
        return;
      }
      sendJson(res, 200, item);
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const created = await repo.create(body);
      sendJson(res, 201, created);
      return;
    }

    if (req.method === "PATCH" && id) {
      const body = await readBody(req);
      const updated = await repo.update(id, body);
      if (!updated) {
        sendJson(res, 404, { message: "Item not found" });
        return;
      }
      sendJson(res, 200, updated);
      return;
    }

    if (req.method === "DELETE" && id) {
      const deleted = await repo.delete(id);
      if (!deleted) {
        sendJson(res, 404, { message: "Item not found" });
        return;
      }
      sendJson(res, 200, deleted);
      return;
    }

    sendJson(res, 405, { message: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { message: error.message || "Server error" });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = {
  Base,
  JsonRepository,
  userRepository,
  taskRepository,
  userBase,
  taskBase,
  server,
};
