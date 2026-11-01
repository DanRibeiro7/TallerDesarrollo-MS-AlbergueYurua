<?php
class Conexion {
    private $host = "localhost";
    private $db_name = "bd_recepcion";
    private $username = "root"; // Cambia si tu MySQL tiene otra credencial
    private $password = "123456"; 
    public $conn;

    public function obtenerConexion() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            // Configurar PDO para que lance excepciones en caso de error
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Forzar el uso de UTF-8 para nombres o comunidades con tildes
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>