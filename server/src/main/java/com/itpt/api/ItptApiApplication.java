// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api;

// 위치: src/main/java/com/itpt/api/ItptApiApplication.java
// 역할: Spring Boot 애플리케이션 실행(메인) 클래스


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * ITPT API Server의 시작 클래스(엔트리 포인트).
 *
 * 이 파일이 하는 일
 * 1) Spring Boot 애플리케이션을 부팅한다.
 * 2) 내장 톰캣을 띄워서 HTTP 요청을 받을 준비를 한다.
 * 3) @Controller/@Service/@Repository/@Configuration 등을 스캔해서 Bean으로 등록한다.
 *
 * 왜 이렇게 작성하나?
 * - Spring Boot는 "한 곳"에서 애플리케이션을 시작하도록 설계되어 있다.
 * - @SpringBootApplication 하나로 (컴포넌트 스캔 + 자동설정 + 설정 클래스 역할)을 묶어서
 *   초기 설정을 단순하게 가져갈 수 있다.
 */
@ConfigurationPropertiesScan
@SpringBootApplication
public class ItptApiApplication {
    // 함수 목적: main 로직을 구현한다.
    public static void main(String[] args) {
        SpringApplication.run(ItptApiApplication.class, args);
    }
}