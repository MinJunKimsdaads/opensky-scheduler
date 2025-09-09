import cron from 'node-cron';
import { saveJsonAndManage } from "./services/services.js";

async function main() {
  try {
    await saveJsonAndManage();
    console.log('✅ 데이터 저장 성공');
  } catch (err) {
    console.error('❌ 스케줄러 실행 중 에러:', err);
    process.exit(1);  // 실패 시 종료코드 1 반환
  }
}

main();