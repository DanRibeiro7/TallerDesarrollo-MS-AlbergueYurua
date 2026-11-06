<?php

class Conexion {

    private $host;
    private $db_name;
    private $username;
    private $password;

    public function __construct() {

        // Configuración para entorno local o Docker
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'bd_recepcion';
        $this->username = getenv('DB_USER') ?: 'root';

        $passwordEntorno = getenv('DB_PASSWORD');
        $this->password = $passwordEntorno !== false
            ? $passwordEntorno
            : '';
    }

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

            throw new RuntimeException(
                "No se pudo conectar a MySQL.",
                0,
                $e
            );
        }
    }
}