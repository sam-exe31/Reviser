package org.example.reviser.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // In production the SPA is served from the same origin as the API, so CORS
    // never comes into play. This mapping only matters for local development,
    // where Vite runs on :5173 and calls the API on :8080. The app is stateless
    // (no cookies / no session auth), so credentials stay disabled.
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }

    // Shared RestTemplate bean for outbound HTTP (Gemini + LeetCode). Spring Boot 4
    // no longer auto-provides a RestTemplate, so services that inject one
    // (LeetCodeService) need this bean to exist or the whole context fails to start.
    // Finite timeouts keep a slow/unreachable external API from hanging a request
    // thread indefinitely.
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(20));
        return new RestTemplate(factory);
    }
}
