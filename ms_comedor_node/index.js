const express = require('express');
const cors = require('cors');
const db = require('./conexion');

const app = express();
const PORT = 3000;

// API del microservicio de Recepción
const RECEPCION_URL =
    process.env.RECEPCION_URL ||
    'http://127.0.0.1:8000/api/api_albergados.php';

app.use(cors());
app.use(express.json());

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// =====================================================
// CONSULTAR ALBERGADOS ACTIVOS DESDE BD_COMEDOR
// =====================================================

async function obtenerAlbergadosActivos() {

    const [albergados] = await db.query(`
        SELECT
            id_albergado,
            dni,
            nombres,
            apellidos,
            tipo,
            estado
        FROM albergados_referencia
        WHERE estado = 'Activo'
        ORDER BY nombres, apellidos
    `);

    return albergados;
}
// =====================================================
// SINCRONIZAR ALBERGADOS DESDE RECEPCIÓN
// =====================================================

async function sincronizarAlbergados() {

    // Consultar Recepción con un tiempo máximo de espera
    const respuesta = await fetch(
    `${RECEPCION_URL}?accion=listar_sincronizacion`,
    { signal: AbortSignal.timeout(5000) }
);

    if (!respuesta.ok) {
        throw new Error('Recepción no está disponible.');
    }

    const resultado = await respuesta.json();

    if (
        resultado.status !== 'success' ||
        !Array.isArray(resultado.data)
    ) {
        throw new Error('Recepción devolvió datos inválidos.');
    }

    const albergados = resultado.data;

    // Actualizar los registros locales sin eliminar los existentes
    for (const albergado of albergados) {

        await db.query(
            `INSERT INTO albergados_referencia
                (
                    id_albergado,
                    dni,
                    nombres,
                    apellidos,
                    tipo,
                    estado,
                    ultima_sincronizacion
                )
             VALUES (?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                dni = VALUES(dni),
                nombres = VALUES(nombres),
                apellidos = VALUES(apellidos),
                tipo = VALUES(tipo),
                estado = VALUES(estado),
                ultima_sincronizacion = NOW()`,
            [
                albergado.id_albergado,
                albergado.dni,
                albergado.nombres,
                albergado.apellidos,
                albergado.tipo,
                albergado.estado
            ]
        );
    }

    return albergados.length;
}
// Obtener la fecha actual según la zona horaria de Perú
function obtenerFechaPeru() {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const valores = {};

    for (const parte of partes) {
        valores[parte.type] = parte.value;
    }

    return `${valores.year}-${valores.month}-${valores.day}`;
}

// Calcular las raciones necesarias
async function calcularRaciones() {
    const albergados = await obtenerAlbergadosActivos();

    const totalActivos = albergados.length;

    return {
        fecha: obtenerFechaPeru(),
        albergados_activos: totalActivos,
        desayunos: totalActivos,
        almuerzos: totalActivos,
        cenas: totalActivos,
        total_raciones: totalActivos * 3
    };
}
// =====================================================
// SINCRONIZACIÓN MANUAL DE ALBERGADOS
// =====================================================

app.post('/api/comedor/sincronizar-albergados', async (req, res) => {

    try {

        const total = await sincronizarAlbergados();

        return res.json({
            status: 'success',
            message: 'Albergados sincronizados correctamente.',
            total_albergados: total
        });

    } catch (error) {

        console.error('Error de sincronización:', error);

        return res.status(503).json({
            status: 'error',
            message: 'No se pudo sincronizar con Recepción.'
        });
    }
});
// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/api/comedor', (req, res) => {
    res.json({
        status: 'success',
        message: 'Microservicio de Comedor listo en Node.js'
    });
});

// =====================================================
// PROBAR CONEXIÓN MYSQL
// =====================================================

app.get('/api/comedor/test-db', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT 1 + 1 AS prueba'
        );

        res.json({
            status: 'success',
            mensaje: 'Conexión a MySQL exitosa en Node.js',
            data: rows
        });

    } catch (error) {
        console.error('Error MySQL:', error);

        res.status(500).json({
            status: 'error',
            message: 'No se pudo conectar a MySQL.'
        });
    }
});

// =====================================================
// LISTAR CONSUMOS
// =====================================================

app.get('/api/comedor/listar', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_consumo,
                id_albergado,
                fecha_hora,
                tipo_comida,
                estado_entrega
            FROM registro_consumo
            ORDER BY fecha_hora DESC, id_consumo DESC
        `);

        res.json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error('Error al listar consumos:', error);

        res.status(500).json({
            status: 'error',
            message: 'No se pudieron consultar los consumos.'
        });
    }
});

// =====================================================
// REGISTRAR CONSUMO
// =====================================================

app.post('/api/comedor/insertar', async (req, res) => {
    try {
        const {
            id_albergado,
            tipo_comida,
            estado_entrega
        } = req.body || {};

        // Validar ID del albergado
        const id = Number(id_albergado);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Debe seleccionar un albergado válido.'
            });
        }

        // Validar tipo de comida
        const comidasPermitidas = [
            'Desayuno',
            'Almuerzo',
            'Cena'
        ];

        if (!comidasPermitidas.includes(tipo_comida)) {
            return res.status(400).json({
                status: 'error',
                message: 'El tipo de comida no es válido.'
            });
        }

        // Validar estado de entrega
        const estado = Number(estado_entrega);

        if (![0, 1].includes(estado)) {
            return res.status(400).json({
                status: 'error',
                message: 'El estado de entrega debe ser 0 o 1.'
            });
        }

        // Consultar los albergados activos en Recepción
        let albergados;

        try {
            albergados = await obtenerAlbergadosActivos();
        } catch (error) {
            console.error('Error al consultar Recepción:', error);

            return res.status(503).json({
                status: 'error',
                message: 'Recepción no está disponible. No se registró el consumo.'
            });
        }

        // Verificar que el albergado exista y esté activo
        const albergado = albergados.find(
            item => Number(item.id_albergado) === id
        );

        if (!albergado) {
            return res.status(400).json({
                status: 'error',
                message: 'El albergado no existe o no está activo en Recepción.'
            });
        }

        // Registrar el consumo
        // MySQL impedirá duplicados mediante el índice UNIQUE.
        const [resultado] = await db.query(
            `INSERT INTO registro_consumo
                (id_albergado, fecha_hora, tipo_comida, estado_entrega)
             VALUES (?, NOW(), ?, ?)`,
            [id, tipo_comida, estado]
        );

        return res.status(201).json({
            status: 'success',
            message: 'Consumo registrado correctamente.',
            id_consumo: resultado.insertId,
            albergado: `${albergado.nombres} ${albergado.apellidos}`
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'Este albergado ya tiene registrada esta comida el día de hoy.'
            });
        }

        console.error('Error al registrar consumo:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Ocurrió un error al registrar el consumo.'
        });
    }
});

// =====================================================
// CONSULTAR CÁLCULO DE RACIONES DEL DÍA
// =====================================================

app.get('/api/comedor/calculo-hoy', async (req, res) => {
    try {
        const calculo = await calcularRaciones();

        return res.json({
            status: 'success',
            message: 'Cálculo de raciones realizado correctamente.',
            ...calculo
        });

    } catch (error) {
        console.error('Error al calcular raciones:', error);

        return res.status(503).json({
            status: 'error',
            message: 'No se pudo calcular las raciones. Verifique que Recepción esté funcionando.'
        });
    }
});

// =====================================================
// GUARDAR O ACTUALIZAR PLANIFICACIÓN DIARIA
// =====================================================

app.post('/api/comedor/guardar-calculo', async (req, res) => {
    try {
        // El cálculo se obtiene desde Recepción.
        const calculo = await calcularRaciones();

        const [resultado] = await db.query(
            `INSERT INTO calculo_diario
                (fecha, total_raciones_requeridas)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
                total_raciones_requeridas = VALUES(total_raciones_requeridas)`,
            [
                calculo.fecha,
                calculo.total_raciones
            ]
        );

        return res.json({
            status: 'success',
            message: 'Planificación diaria guardada correctamente.',
            ...calculo
        });

    } catch (error) {
        console.error('Error al guardar planificación:', error);

        return res.status(503).json({
            status: 'error',
            message: 'No se pudo guardar la planificación. Verifique los microservicios y MySQL.'
        });
    }
});
// =====================================================
// MARCAR UNA COMIDA COMO ENTREGADA
// =====================================================

app.post('/api/comedor/marcar-entregado', async (req, res) => {

    try {

        const { id_consumo } = req.body || {};

        // Validar el ID del consumo
        const id = Number(id_consumo);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Debe proporcionar un ID de consumo válido.'
            });
        }

        // Actualizar únicamente si está pendiente
        const [resultado] = await db.query(
            `UPDATE registro_consumo
             SET estado_entrega = 1
             WHERE id_consumo = ?
               AND estado_entrega = 0`,
            [id]
        );

        // Comprobar si se actualizó el registro
        if (resultado.affectedRows === 1) {

            return res.json({
                status: 'success',
                message: 'Comida marcada como entregada correctamente.',
                id_consumo: id
            });

        }

        // Si no se actualizó, consultar el motivo
        const [registros] = await db.query(
            `SELECT id_consumo, estado_entrega
             FROM registro_consumo
             WHERE id_consumo = ?`,
            [id]
        );

        if (registros.length === 0) {

            return res.status(404).json({
                status: 'error',
                message: 'El registro de consumo no existe.'
            });

        }

        if (Number(registros[0].estado_entrega) === 1) {

            return res.status(409).json({
                status: 'error',
                message: 'Esta comida ya fue marcada como entregada.'
            });

        }

        return res.status(409).json({
            status: 'error',
            message: 'No se pudo cambiar el estado del consumo.'
        });

    } catch (error) {

        console.error('Error al marcar comida como entregada:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Ocurrió un error al actualizar el estado de la comida.'
        });

    }

});
// =====================================================
// INICIAR SERVIDOR NODE.JS
// =====================================================
// =====================================================
// LISTAR ALBERGADOS DESDE LA BASE DE DATOS LOCAL
// =====================================================

app.get('/api/comedor/albergados', async (req, res) => {
    try {
        const [albergados] = await db.query(`
            SELECT
                id_albergado,
                dni,
                nombres,
                apellidos,
                tipo,
                estado
            FROM albergados_referencia
            WHERE estado = 'Activo'
            ORDER BY nombres, apellidos
        `);

        return res.json({
            status: 'success',
            data: albergados
        });

    } catch (error) {
        console.error('Error al consultar albergados:', error);

        return res.status(500).json({
            status: 'error',
            message: 'No se pudieron consultar los albergados locales.'
        });
    }
});
// =====================================================
// SINCRONIZACIÓN AUTOMÁTICA CON RECEPCIÓN
// =====================================================

const INTERVALO_SINCRONIZACION = 30000; // 30 segundos

let sincronizacionEnProceso = false;

async function ejecutarSincronizacionAutomatica() {

    // Evitar sincronizaciones simultáneas
    if (sincronizacionEnProceso) {
        return;
    }

    sincronizacionEnProceso = true;

    try {

        console.log(
            '[COMEDOR] Iniciando sincronización automática...'
        );

        const total = await sincronizarAlbergados();

        console.log(
            `[COMEDOR] Sincronización correcta. ${total} albergados recibidos.`
        );

    } catch (error) {

        console.log(
            '[COMEDOR] Recepción no disponible. Se conservarán los datos locales.'
        );

    } finally {

        sincronizacionEnProceso = false;

    }
}

// =====================================================
// INICIAR SERVIDOR NODE.JS
// =====================================================

app.listen(PORT, () => {

    console.log(
        `Servidor Node.js corriendo en http://localhost:${PORT}`
    );

    // Primera sincronización al iniciar
    ejecutarSincronizacionAutomatica();

    // Sincronización periódica cada 30 segundos
    setInterval(
        ejecutarSincronizacionAutomatica,
        INTERVALO_SINCRONIZACION
    );

});