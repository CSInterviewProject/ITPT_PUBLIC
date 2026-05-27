// 파일 목적: async config 관련 프레임워크 동작을 설정한다.
package com.itpt.api.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.beans.factory.annotation.Value;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Value("${app.system-log.executor.core-size:2}")
    private int coreSize;

    @Value("${app.system-log.executor.max-size:8}")
    private int maxSize;

    @Value("${app.system-log.executor.queue-capacity:1000}")
    private int queueCapacity;

    // 함수 목적: system log executor 로직을 구현한다.
    @Bean(name = "systemLogExecutor")
    public Executor systemLogExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(coreSize);
        executor.setMaxPoolSize(maxSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("system-log-");
        executor.setAllowCoreThreadTimeOut(true);
        // 부하 상황에서 로깅 작업을 요청 스레드에서 실행하지 않는다.
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardOldestPolicy());
        executor.initialize();
        return executor;
    }
}
