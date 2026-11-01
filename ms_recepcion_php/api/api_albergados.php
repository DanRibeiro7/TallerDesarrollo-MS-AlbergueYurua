<?php
// Cabeceras CORS para permitir que Angular (puerto 4200) se comunique sin bloqueos de seguridad
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/conexion.php';

$base = new Conexion();
$db = $base->obtenerConexion();

// Identificar la acción solicitada
$accion = isset($_GET['accion']) ? $_GET['accion'] : '';

switch($accion) {
    case 'activos':
        // Método GET: Consumido por el MS-Comedor para saber cuántas raciones preparar
        $query = "SELECT COUNT(*) as total_activos FROM albergados WHERE estado = 'Activo'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success",
            "total_activos" => $row['total_activos']
        ]);
        break;

    case 'listar':
        // Método GET: Consumido por Angular para mostrar la tabla de recepcion
        $query = "SELECT * FROM albergados WHERE estado = 'Activo' ORDER BY id_albergado DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $albergados = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($albergados, $row);
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $albergados
        ]);
        break;

    case 'registrar':
        // Método POST: Consumido por Angular al enviar el formulario de un nuevo huésped
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->nombres) && !empty($data->apellidos) && !empty($data->tipo)) {
            $query = "INSERT INTO albergados (nombres, apellidos, dni, tipo, comunidad_origen, id_paciente_vinculado, estado) 
                      VALUES (:nombres, :apellidos, :dni, :tipo, :comunidad_origen, :id_paciente_vinculado, 'Activo')";
            
            $stmt = $db->prepare($query);
            
            // Limpieza y asignación de parámetros
            $stmt->bindParam(":nombres", htmlspecialchars(strip_tags($data->nombres)));
            $stmt->bindParam(":apellidos", htmlspecialchars(strip_tags($data->apellidos)));
            $stmt->bindParam(":dni", htmlspecialchars(strip_tags($data->dni ?? '')));
            $stmt->bindParam(":tipo", htmlspecialchars(strip_tags($data->tipo)));
            $stmt->bindParam(":comunidad_origen", htmlspecialchars(strip_tags($data->comunidad_origen ?? '')));
            $stmt->bindParam(":id_paciente_vinculado", $data->id_paciente_vinculado);
            
            if($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Albergado registrado correctamente."]);
            } else {
                echo json_encode(["status" => "error", "message" => "No se pudo registrar en la base de datos."]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Datos incompletos. Nombres, apellidos y tipo son obligatorios."]);
        }
        break;

    case 'dar_baja':
        // Método POST: Consumido por Angular cuando una persona se retira del albergue
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->id_albergado)) {
            $query = "UPDATE albergados SET estado = 'Inactivo' WHERE id_albergado = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id_albergado);
            
            if($stmt->execute()) {
                // Aquí, idealmente, también se haría un UPDATE a la tabla asignaciones para poner fecha_salida
                echo json_encode(["status" => "success", "message" => "El albergado ha sido dado de baja."]);
            } else {
                echo json_encode(["status" => "error", "message" => "No se pudo actualizar el estado."]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Falta el ID del albergado."]);
        }
        break;

    default:
        // Si ingresan una ruta que no existe
        echo json_encode(["status" => "error", "message" => "Acción no válida o no especificada."]);
        break;
}
?>