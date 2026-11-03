<?php

class Conexion {

    private $host = "localhost";
    private $db_name = "bd_recepcion";
    private $username = "root";
    private $password = "123456";

    public function obtenerConexion() {

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";

            $conn = new PDO(
                $dsn,
                $this->username,
                $this->password
            );

            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

            return $conn;

        } catch (PDOException $e) {
            error_log("Error de conexión MySQL: " . $e->getMessage());
            throw new RuntimeException("No se pudo conectar a MySQL.", 0, $e);
        }
    }
}