// 파일 목적: jackson config 관련 프레임워크 동작을 설정한다.
package com.itpt.api.global.config;

// 위치: src/main/java/com/itpt/api/global/config/JacksonConfig.java
// 역할: Jackson(ObjectMapper) 설정 - LocalDateTime 직렬화 지원

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    // 함수 목적: jackson customizer 로직을 구현한다.
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            builder.modules(new JavaTimeModule());
            builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        };
    }
}