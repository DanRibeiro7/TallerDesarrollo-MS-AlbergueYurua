#!/bin/bash
set -e

echo "======================================"
echo " INICIALIZANDO MYSQL - ALBERGUE YURUA"
echo "======================================"

# Crear las tres bases de datos
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS bd_recepcion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS bd_comedor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS bd_porteria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

# Crear usuarios y asignar contraseñas
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE USER IF NOT EXISTS 'recepcion_user'@'%' IDENTIFIED BY '${RECEPCION_DB_PASSWORD}';
CREATE USER IF NOT EXISTS 'comedor_user'@'%' IDENTIFIED BY '${COMEDOR_DB_PASSWORD}';
CREATE USER IF NOT EXISTS 'porteria_user'@'%' IDENTIFIED BY '${PORTERIA_DB_PASSWORD}';

GRANT ALL PRIVILEGES ON bd_recepcion.* TO 'recepcion_user'@'%';
GRANT ALL PRIVILEGES ON bd_comedor.* TO 'comedor_user'@'%';
GRANT ALL PRIVILEGES ON bd_porteria.* TO 'porteria_user'@'%';
SQL

# Importar respaldos
echo "Importando Recepcion..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" bd_recepcion < /respaldos/bd_recepcion.sql

echo "Importando Comedor..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" bd_comedor < /respaldos/bd_comedor_corregido.sql

echo "Importando Porteria..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" bd_porteria < /respaldos/bd_porteria.sql

echo "======================================"
echo " MYSQL INICIALIZADO CORRECTAMENTE"
echo "======================================"