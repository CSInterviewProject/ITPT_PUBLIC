// 파일 목적: status 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 경량 헬스체크 엔드포인트다.
 * 컨트롤러는 인프라를 위한 전송 계층 liveness probe를 노출한다.
 * 도메인 로직을 건드리지 않고 인프라/클라이언트가 상태를 확인할 수 있게 한다.
 */
@RestController
public class StatusController {

    /**
     * 프로브에서 사용하는 정적 상태 마커를 반환한다.
     */
    @GetMapping("/status")
    public String status() {
        return "ok";
    }
}
