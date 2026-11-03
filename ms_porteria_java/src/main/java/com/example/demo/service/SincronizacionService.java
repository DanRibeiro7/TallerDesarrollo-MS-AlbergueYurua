package com.example.demo.service;

import com.example.demo.controller.PorteriaController;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SincronizacionService {

    @Autowired
    private PorteriaController porteriaController;

    // Ejecutar cada 60 segundos
    @Scheduled(fixedDelay = 60000)
    public void sincronizarAutomaticamente() {

        System.out.println(
            "[PORTERIA] Iniciando sincronizacion automatica..."
        );

        try {

            ResponseEntity<?> respuesta =
                    porteriaController.sincronizarAlbergados();

            if (respuesta.getStatusCode().is2xxSuccessful()) {

                System.out.println(
                    "[PORTERIA] Albergados sincronizados correctamente."
                );

            } else {

                System.out.println(
                    "[PORTERIA] Recepcion no disponible. " +
                    "Se conservaran los datos locales."
                );

            }

        } catch (Exception e) {

            System.out.println(
                "[PORTERIA] No se pudo sincronizar. " +
                "Porteria continuara funcionando con su base local."
            );

        }

    }

}