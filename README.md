# opensky-scheduler
opensky-scheduler
# ✈️ Flight Data Scheduler

이 프로젝트는 [OpenSky Network](https://opensky-network.org/)의 실시간 항공 정보를 주기적으로 수집하고, 이를 FTP를 통해 **웹 호스팅 서버에 JSON 파일로 저장**하는 스케줄러입니다.

## 🔧 동작 방식

1. GitHub Actions의 `cron` 기능을 이용해 **15분마다 자동 실행**됩니다.
2. OpenSky API에서 **전 세계 항공기 실시간 위치 데이터**를 호출합니다.
3. 응답 받은 JSON 데이터를 특정 포맷으로 저장합니다.
4. FTP를 통해 사용자의 **웹 호스팅 서버에 업로드**합니다.
5. 프론트엔드 프로젝트에서는 이 JSON 파일을 호출해 **최신 항공 정보를 클라이언트에 표시**합니다.