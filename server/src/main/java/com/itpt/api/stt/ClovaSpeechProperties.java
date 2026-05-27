// 파일 목적: clova speech 설정 프로퍼티 매핑을 정의한다.
package com.itpt.api.stt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "clova.speech")
public record ClovaSpeechProperties(
        String invokeUrl,
        String secret,
        String domainCode
) {
}
