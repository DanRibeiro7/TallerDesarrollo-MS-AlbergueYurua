<?php
// API Recepcion - compatible con PHP 7.3
header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function respuesta($codigo, $estado, $mensaje, $extra = array()) {
    http_response_code($codigo);
    echo json_encode(array_merge(array('status' => $estado, 'message' => $mensaje), $extra), JSON_UNESCAPED_UNICODE);
    exit;
}
function entrada() {
    $data = json_decode(file_get_contents('php://input'));
    if (!is_object($data)) respuesta(400, 'error', 'Debe enviar un JSON valido.');
    return $data;
}
function txt($v) { return is_string($v) ? trim($v) : ''; }
function persona($d) {
    $dni = txt(isset($d->dni) ? $d->dni : null);
    $nombres = txt(isset($d->nombres) ? $d->nombres : null);
    $apellidos = txt(isset($d->apellidos) ? $d->apellidos : null);
    $tipo = txt(isset($d->tipo) ? $d->tipo : null);
    $comunidad = txt(isset($d->comunidad_origen) ? $d->comunidad_origen : null);
    if (!preg_match('/^[0-9]{8}$/D', $dni)) respuesta(400, 'error', 'El DNI debe tener 8 digitos.');
    if ($nombres === '' || $apellidos === '') respuesta(400, 'error', 'Nombres y apellidos son obligatorios.');
    if (!in_array($tipo, array('Paciente','Acompañante','Estudiante'), true)) respuesta(400, 'error', 'Tipo de albergado no valido.');
    return array($dni,$nombres,$apellidos,$tipo,$comunidad);
}
function idPositivo($valor) {
    $id = filter_var($valor, FILTER_VALIDATE_INT);
    return ($id !== false && $id > 0) ? (int)$id : null;
}
function verificarHabitacion($db, $id, $tipo, $excluirAlbergado = null) {
    $st = $db->prepare('SELECT id_habitacion, numero_cuarto, capacidad_camas, estado FROM habitaciones WHERE id_habitacion = ? FOR UPDATE');
    $st->execute(array($id));
    $h = $st->fetch(PDO::FETCH_ASSOC);
    if (!$h) throw new DomainException('La habitacion no existe.');
    if ($h['estado'] === 'Mantenimiento') throw new DomainException('La habitacion esta en mantenimiento.');
    $numero = (string)$h['numero_cuarto'];
    $esPisoCorrecto = ($tipo === 'Estudiante') ? preg_match('/^2[0-9]{2}$/D', $numero) : preg_match('/^1[0-9]{2}$/D', $numero);
    if (!$esPisoCorrecto) throw new DomainException('La habitacion no corresponde al tipo de albergado.');
    if ($excluirAlbergado === null) {
        $st = $db->prepare('SELECT COUNT(*) FROM asignaciones WHERE id_habitacion = ? AND fecha_salida IS NULL');
        $st->execute(array($id));
    } else {
        $st = $db->prepare('SELECT COUNT(*) FROM asignaciones WHERE id_habitacion = ? AND fecha_salida IS NULL AND id_albergado <> ?');
        $st->execute(array($id, $excluirAlbergado));
    }
    if ((int)$st->fetchColumn() >= (int)$h['capacidad_camas']) throw new DomainException('La habitacion no tiene camas disponibles.');
}


// Comprueba que el acompanante este vinculado a un paciente activo.
function validarVinculo($db, $tipo, $valor, $idActual = null) {
    if ($tipo !== 'Acompañante') return null;
    $idPaciente = idPositivo($valor);
    if ($idPaciente === null) throw new DomainException('Seleccione el paciente al que acompaña.');
    if ($idActual !== null && $idPaciente === $idActual) {
        throw new DomainException('Un albergado no puede vincularse consigo mismo.');
    }
    $st = $db->prepare("SELECT tipo, estado FROM albergados WHERE id_albergado = ? FOR UPDATE");
    $st->execute(array($idPaciente));
    $paciente = $st->fetch(PDO::FETCH_ASSOC);
    if (!$paciente || $paciente['tipo'] !== 'Paciente' || $paciente['estado'] !== 'Activo') {
        throw new DomainException('Debe seleccionar un paciente activo y válido.');
    }
    return $idPaciente;
}

// Impide dejar acompanantes activos sin un paciente activo asociado.
function verificarAcompanantesActivos($db, $idPaciente) {
    $st = $db->prepare("SELECT COUNT(*) FROM albergados WHERE id_paciente_vinculado = ? AND tipo = 'Acompañante' AND estado = 'Activo'");
    $st->execute(array($idPaciente));
    if ((int)$st->fetchColumn() > 0) {
        throw new DomainException('Este paciente tiene acompañantes activos. Dé de baja o reasigne primero a sus acompañantes.');
    }
}

$accion = isset($_GET['accion']) ? $_GET['accion'] : '';
$metodos = array('activos'=>'GET','listar'=>'GET','habitaciones_disponibles'=>'GET','listar_pacientes'=>'GET','registrar'=>'POST','editar'=>'POST','dar_baja'=>'POST');
if (!isset($metodos[$accion])) respuesta(404, 'error', 'Accion no valida.');
if ($_SERVER['REQUEST_METHOD'] !== $metodos[$accion]) respuesta(405, 'error', 'Metodo HTTP no permitido.');

try {
    require_once __DIR__ . '/../config/conexion.php';
    $base = new Conexion();
    $db = $base->obtenerConexion();
    if (!($db instanceof PDO)) throw new RuntimeException('No se obtuvo una conexion PDO.');

    switch ($accion) {
        case 'activos':
            $total = $db->query("SELECT COUNT(*) FROM albergados WHERE estado = 'Activo'")->fetchColumn();
            respuesta(200, 'success', 'Consulta correcta.', array('total_activos' => (int)$total));
            break;

        case 'listar':
            $st = $db->query("SELECT * FROM albergados WHERE estado = 'Activo' ORDER BY id_albergado DESC");
            respuesta(200, 'success', 'Consulta correcta.', array('data' => $st->fetchAll(PDO::FETCH_ASSOC)));
            break;

        case 'listar_pacientes':
            $st = $db->query("SELECT id_albergado, nombres, apellidos, dni FROM albergados WHERE tipo = 'Paciente' AND estado = 'Activo' ORDER BY nombres, apellidos");
            respuesta(200, 'success', 'Consulta correcta.', array('data' => $st->fetchAll(PDO::FETCH_ASSOC)));
            break;

        case 'habitaciones_disponibles':
            $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : '';
            if (!in_array($tipo, array('Paciente','Acompañante','Estudiante'), true)) respuesta(400, 'error', 'Seleccione un tipo valido.');
            $piso = ($tipo === 'Estudiante') ? '2%' : '1%';
            $sql = "SELECT h.id_habitacion, h.numero_cuarto, h.capacidad_camas,
                           (h.capacidad_camas - COUNT(a.id_asignacion)) AS espacio_libre
                    FROM habitaciones h
                    LEFT JOIN asignaciones a ON a.id_habitacion = h.id_habitacion AND a.fecha_salida IS NULL
                    WHERE CAST(h.numero_cuarto AS CHAR) LIKE ? AND h.estado <> 'Mantenimiento'
                    GROUP BY h.id_habitacion, h.numero_cuarto, h.capacidad_camas, h.estado
                    HAVING espacio_libre > 0 ORDER BY h.numero_cuarto";
            $st = $db->prepare($sql);
            $st->execute(array($piso));
            respuesta(200, 'success', 'Consulta correcta.', array('data' => $st->fetchAll(PDO::FETCH_ASSOC)));
            break;

        case 'registrar':
            $d = entrada();
            list($dni,$nombres,$apellidos,$tipo,$comunidad) = persona($d);
            $idHabitacion = idPositivo(isset($d->id_habitacion) ? $d->id_habitacion : null);
            if ($idHabitacion === null) respuesta(400, 'error', 'Seleccione una habitacion.');
            $db->beginTransaction();
            $st = $db->prepare('SELECT id_albergado, estado FROM albergados WHERE dni = ? FOR UPDATE');
            $st->execute(array($dni));
            $anterior = $st->fetch(PDO::FETCH_ASSOC);
            if ($anterior && $anterior['estado'] === 'Activo') {
                $db->rollBack();
                respuesta(409, 'error', 'Este DNI ya pertenece a un albergado activo.');
            }
            $idVinculo = validarVinculo($db, $tipo, isset($d->id_paciente_vinculado) ? $d->id_paciente_vinculado : null);
            verificarHabitacion($db, $idHabitacion, $tipo);
            if ($anterior) {
                $idAlbergado = (int)$anterior['id_albergado'];
                $st = $db->prepare('SELECT COUNT(*) FROM asignaciones WHERE id_albergado = ? AND fecha_salida IS NULL');
                $st->execute(array($idAlbergado));
                if ((int)$st->fetchColumn() > 0) throw new DomainException('El albergado ya tiene una asignacion activa.');
                $st = $db->prepare("UPDATE albergados SET nombres=?, apellidos=?, tipo=?, comunidad_origen=?, id_paciente_vinculado=?, estado='Activo' WHERE id_albergado=?");
                $st->execute(array($nombres,$apellidos,$tipo,$comunidad,$idVinculo,$idAlbergado));
                $mensaje = 'Albergado reactivado correctamente. Nuevo ingreso registrado.';
            } else {
                $st = $db->prepare("INSERT INTO albergados (nombres, apellidos, dni, tipo, comunidad_origen, id_paciente_vinculado, estado) VALUES (?,?,?,?,?,?,'Activo')");
                $st->execute(array($nombres,$apellidos,$dni,$tipo,$comunidad,$idVinculo));
                $idAlbergado = (int)$db->lastInsertId();
                $mensaje = 'Nuevo albergado registrado correctamente.';
            }
            $st = $db->prepare('INSERT INTO asignaciones (id_albergado,id_habitacion,fecha_ingreso) VALUES (?,?,NOW())');
            $st->execute(array($idAlbergado,$idHabitacion));
            $db->commit();
            respuesta(201, 'success', $mensaje, array('id_albergado'=>$idAlbergado));
            break;

        case 'editar':
            $d = entrada();
            $id = idPositivo(isset($d->id_albergado) ? $d->id_albergado : null);
            if ($id === null) respuesta(400, 'error', 'ID de albergado invalido.');
            list($dni,$nombres,$apellidos,$tipo,$comunidad) = persona($d);
            $nuevoCuarto = null;
            if (isset($d->id_habitacion) && $d->id_habitacion !== '' && $d->id_habitacion !== null) {
                $nuevoCuarto = idPositivo($d->id_habitacion);
                if ($nuevoCuarto === null) respuesta(400, 'error', 'Habitacion invalida.');
            }
            $db->beginTransaction();
            $st = $db->prepare('SELECT id_albergado, tipo, estado FROM albergados WHERE id_albergado = ? FOR UPDATE');
            $st->execute(array($id));
            $personaActual = $st->fetch(PDO::FETCH_ASSOC);
            if (!$personaActual) throw new DomainException('Albergado no encontrado.');
            if ($personaActual['estado'] !== 'Activo') throw new DomainException('No puede editar un albergado inactivo.');
            if ($personaActual['tipo'] === 'Paciente' && $tipo !== 'Paciente') {
                verificarAcompanantesActivos($db, $id);
            }
            $idVinculo = validarVinculo($db, $tipo, isset($d->id_paciente_vinculado) ? $d->id_paciente_vinculado : null, $id);
            $st = $db->prepare('SELECT id_albergado FROM albergados WHERE dni = ? AND id_albergado <> ?');
            $st->execute(array($dni,$id));
            if ($st->fetch()) throw new DomainException('El DNI ya esta registrado por otra persona.');
            $st = $db->prepare('SELECT id_asignacion, id_habitacion FROM asignaciones WHERE id_albergado = ? AND fecha_salida IS NULL ORDER BY id_asignacion DESC LIMIT 1');
            $st->execute(array($id));
            $actual = $st->fetch(PDO::FETCH_ASSOC);
            if ($nuevoCuarto !== null) {
                verificarHabitacion($db, $nuevoCuarto, $tipo, $id);
            } elseif ($actual) {
                // Aun sin traslado, verificar que el tipo coincida con el piso actual.
                $st = $db->prepare('SELECT numero_cuarto FROM habitaciones WHERE id_habitacion = ?');
                $st->execute(array($actual['id_habitacion']));
                $numero = (string)$st->fetchColumn();
                $correcto = ($tipo === 'Estudiante') ? preg_match('/^2[0-9]{2}$/D',$numero) : preg_match('/^1[0-9]{2}$/D',$numero);
                if (!$correcto) throw new DomainException('Para cambiar el tipo, seleccione una habitacion del piso correspondiente.');
            }
            $st = $db->prepare('UPDATE albergados SET nombres=?, apellidos=?, dni=?, tipo=?, comunidad_origen=?, id_paciente_vinculado=? WHERE id_albergado=?');
            $st->execute(array($nombres,$apellidos,$dni,$tipo,$comunidad,$idVinculo,$id));
            if ($nuevoCuarto !== null) {
                if ($actual && (int)$actual['id_habitacion'] !== $nuevoCuarto) {
                    $st = $db->prepare('UPDATE asignaciones SET fecha_salida=NOW() WHERE id_asignacion=?');
                    $st->execute(array($actual['id_asignacion']));
                    $st = $db->prepare('INSERT INTO asignaciones (id_albergado,id_habitacion,fecha_ingreso) VALUES (?,?,NOW())');
                    $st->execute(array($id,$nuevoCuarto));
                } elseif (!$actual) {
                    throw new DomainException('El albergado no tiene una asignacion activa para trasladar.');
                }
            }
            $db->commit();
            respuesta(200, 'success', 'Registro actualizado correctamente.');
            break;

        case 'dar_baja':
            $d = entrada();
            $id = idPositivo(isset($d->id_albergado) ? $d->id_albergado : null);
            if ($id === null) respuesta(400, 'error', 'ID de albergado invalido.');
            $db->beginTransaction();
            $st = $db->prepare('SELECT tipo, estado FROM albergados WHERE id_albergado = ? FOR UPDATE');
            $st->execute(array($id));
            $actualBaja = $st->fetch(PDO::FETCH_ASSOC);
            if (!$actualBaja) throw new DomainException('Albergado no encontrado.');
            if ($actualBaja['tipo'] === 'Paciente' && $actualBaja['estado'] === 'Activo') {
                verificarAcompanantesActivos($db, $id);
            }
            $st = $db->prepare("UPDATE albergados SET estado='Inactivo' WHERE id_albergado=?");
            $st->execute(array($id));
            if ($st->rowCount() === 0) {
                $st = $db->prepare('SELECT id_albergado FROM albergados WHERE id_albergado=?');
                $st->execute(array($id));
                if (!$st->fetch()) throw new DomainException('Albergado no encontrado.');
            }
            $st = $db->prepare('UPDATE asignaciones SET fecha_salida=NOW() WHERE id_albergado=? AND fecha_salida IS NULL');
            $st->execute(array($id));
            $db->commit();
            respuesta(200, 'success', 'Dado de baja exitosamente. Cama liberada.');
            break;
    }
} catch (Exception $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) $db->rollBack();
    error_log('API Recepcion: ' . $e->getMessage());
    $codigo = ($e instanceof DomainException) ? 400 : 500;
    respuesta($codigo, 'error', ($codigo === 400 ? $e->getMessage() : 'Error interno de Recepcion. Revise la terminal PHP.'));
} catch (Error $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) $db->rollBack();
    error_log('API Recepcion: ' . $e->getMessage());
    respuesta(500, 'error', 'Error interno de PHP. Revise la terminal.');
}
