import cron from 'node-cron';
import { saveJsonTempAndUpload } from "./services/services.js";

// 3분마다 실행
// cron.schedule('*/15 * * * *', async () => {
//     try {
//         await saveJsonTempAndUpload();
//     } catch (err) {
//         console.error('❌ 스케줄러 에러 발생:', err);
//     }
// });

async function main() {
  try {
    await saveJsonTempAndUpload();
    console.log('✅ 데이터 저장 성공');
  } catch (err) {
    console.error('❌ 스케줄러 실행 중 에러:', err);
    process.exit(1);  // 실패 시 종료코드 1 반환
  }
}

main();