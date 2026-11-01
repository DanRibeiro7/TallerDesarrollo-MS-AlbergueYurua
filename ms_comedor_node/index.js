const express = require('express');
const cors = require('cors');
const db = require('./conexion');

const app = express();
// Utilizamos el puerto 3000 para evitar conflictos con el 8000 de PHP
const PORT = 3000; 

app.use(cors());
app.use(express.json());

// Ruta inicial de prueba
app.get('/api/comedor', (req, res) => {
    res.json({ status: "success", message: "Microservicio de Comedor listo en Node.js" });
});

app.get('/api/comedor/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS prueba');
        res.json({ status: "success", mensaje: "Conexión a MySQL exitosa en Node.js", data: rows });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
// Ruta para LISTAR los registros de consumo
app.get('/api/comedor/listar', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM registro_consumo');
        res.json({ status: "success", data: rows });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// Ruta para INSERTAR un nuevo registro de consumo
app.post('/api/comedor/insertar', async (req, res) => {
    try {
        const { id_albergado, tipo_comida, estado_entrega } = req.body; 
        
        const [result] = await db.query(
            'INSERT INTO registro_consumo (id_albergado, fecha_hora, tipo_comida, estado_entrega) VALUES (?, NOW(), ?, ?)',
            [id_albergado, tipo_comida, estado_entrega]
        );
        
        res.json({ status: "success", message: "Consumo registrado correctamente", id_consumo: result.insertId });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});