import cron from 'node-cron';
import { saveJsonTempAndUpload } from "./services/services.js";

// 3분마다 실행
cron.schedule('*/3 * * * *', async () => {
    try {
        await saveJsonTempAndUpload();
    } catch (err) {
        console.error('❌ 스케줄러 에러 발생:', err);
    }
});