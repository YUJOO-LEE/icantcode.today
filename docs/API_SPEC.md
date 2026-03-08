# API_SPEC.md — icantcode.today API 명세

---

## 1. 개요

Phase 1 API가 완성되었습니다.
**프론트엔드에서 API 엔드포인트, 요청/응답 형식을 임의로 정의하지 않습니다.**

### Swagger UI (API 문서)

`.env` 파일의 `API_DOCS_URL`에서 base URL을 확인하세요. Swagger UI는 `{base}/swagger-ui/index.html` 경로입니다.

### OpenAPI JSON

`.env` 파일의 `API_DOCS_URL`을 참조하세요.

---

## 2. 프론트엔드 연동 원칙

### 2.1 API 정의 금지
- 엔드포인트 URL, 요청/응답 필드명을 프론트엔드에서 임의로 정하지 않음
- Swagger UI에 정의된 명세를 기준으로만 구현
- 명세가 불명확한 경우 백엔드 엔지니어에게 확인 후 진행
- 타입 정의 방식은 추후 결정 예정

### 2.2 인증 방식

익명 세션 기반. 상세 플로우는 [SERVICE_PLAN.md Section 4.3](SERVICE_PLAN.md) 참조.

### 2.3 Base URL 설정

```env
VITE_API_BASE_URL=https://your-api-url.example.com<.env 파일 참조>
```

---

*마지막 업데이트: 2026-03-08*
