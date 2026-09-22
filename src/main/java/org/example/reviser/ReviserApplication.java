package org.example.reviser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ReviserApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReviserApplication.class, args);
    }

}
