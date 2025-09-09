import { saveJsonAndManage } from "./services/services.js";

async function main() {
  try {
    await saveJsonAndManage();  // ./data 폴더에 JSON 생성 및 오래된 파일 정리
    console.log("🎉 OpenSky 데이터 저장 완료");
  } catch (err) {
    console.error("❌ 스케줄러 실행 중 에러:", err);
    process.exit(1);
  }
}

main();