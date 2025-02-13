const express = require('express');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');  // Importamos cors
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');
const http = require('http');

// Middleware para habilitar CORS
app.use(cors({
  origin: '*',  // Permitir solicitudes de cualquier origen
  methods: 'GET,POST',  // Solo permitir estos métodos (opcional)
  allowedHeaders: 'Content-Type, apikey',  // Permitir ciertos encabezados
}));

// Middleware para parsear el cuerpo de las peticiones en formato JSON
app.use(express.json());
app.use(express.static('/public'));

// Configurar la base de datos SQLite
const db = new sqlite3.Database('./messages.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Crear la tabla de mensajes si no existe (con campo de username opcional)
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  username TEXT DEFAULT 'Usuario Anónimo'
)`, (err) => {
  if (err) {
    console.error('Error al crear la tabla de mensajes', err.message);
  }
});

// API key (la definirás tú)
const API_KEY = '1234';

// Middleware para verificar la API key
const requireApiKey = (req, res, next) => {
  const apiKey = req.header('apikey');
  console.log('API Key recibida:', apiKey); // Esto imprimirá el valor del encabezado `apikey`
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};


// Endpoint GET / que devuelve un mensaje de bienvenida
app.get('/', (req, res) => {
  res.json({ message: '¡Bienvenido al servidor!' });
});

// Endpoint GET /messages que devuelve los mensajes almacenados
app.get('/messages', requireApiKey, (req, res) => {
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener los mensajes' });
    }
    res.json({ messages: rows });
  });
});

// Endpoint POST /messages que permite añadir un mensaje y un nombre de usuario opcional
app.post('/messages', requireApiKey, (req, res) => {
  const { message, username } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Si no se proporciona un nombre de usuario, usar 'Usuario Anónimo'
  const user = username || 'Usuario Anónimo';

  // Insertar el mensaje y el nombre de usuario en la base de datos
  db.run('INSERT INTO messages (message, username) VALUES (?, ?)', [message, user], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
    res.status(201).json({ message: 'Message added successfully', id: this.lastID });
  });
});

console.log('Entorno:', process.env.NODE_ENV);
// if(process.env.NODE_ENV === 'production') {
//     // Configuración de HTTPS
//     const options = {
//       cert: fs.readFileSync(path.join(__dirname, 'fullchain.pem')),
//       key: fs.readFileSync(path.join(__dirname, 'privkey.pem'))
//     };

//     // Crear servidor HTTPS
//     https.createServer(options, app).listen(port, () => {
//       console.log(`Servidor HTTPS en https://cyberbunny.online:${port}`);
//     });
// }
// else{
//     http.createServer(app).listen(port, () => {
//       console.log(`Servidor HTTP en http://localhost:${port}`);
//     });
// }

http.createServer(app).listen(port, () => {
  console.log(`Servidor HTTP en http://localhost:${port}`);
});
