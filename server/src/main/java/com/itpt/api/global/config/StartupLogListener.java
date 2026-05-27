// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.config;

//서버 연결 확인로그

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class StartupLogListener {

    private static final Logger log = LoggerFactory.getLogger(StartupLogListener.class);

    // 함수 목적: on ready 로직을 구현한다.
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info("========================================");
        log.info("ITPT SERVER STARTED SUCCESSFULLY");
        log.info("Server URL: http://localhost:8080");
        log.info("========================================");
    }
}