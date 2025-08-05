import fetch from "node-fetch";
import fs from 'fs';
import path from "path";
import ftp from 'basic-ftp';
import dotenv from "dotenv";

dotenv.config();

const getAccessToken = async () => {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.OPENSKY_CLIENT_ID);
        params.append('client_secret', process.env.OPENSKY_CLIENT_SECRET);

        const response = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.warn(error);
        return null; // fallback 처리
    }
}


const getAllAircraftList = async () => {
    try {
        const token = await getAccessToken();

        const headers = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        const response = await fetch('https://opensky-network.org/api/states/all', {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(error);
        throw error;
    }
};

const uploadToSFTP = async (localPath, filename) => {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: process.env.SFTP_HOST,
            user: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD,
            port: process.env.SFTP_PORT, // FTP 포트
            secure: false, // FTPS가 아닌 경우 false
        });
        const remotePath = path.posix.join(process.env.SFTP_PATH, filename);
        console.log(remotePath);
        // await client.cd(process.env.SFTP_PATH) // 'html' 디렉토리로 이동
        await client.uploadFrom(localPath, remotePath);
        console.log('FTP 업로드 성공');
    } catch(err){
        console.error(err);
    } finally{
        client.close();
    }
}

export const saveJsonTempAndUpload = async () => {
    try {
        const data = await getAllAircraftList();
        const time = data.time;
        if (!time) throw new Error('time 값이 없습니다.');

        const filename = `${time}.json`;
        const tempDir = './temp';

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const localPath = path.resolve(tempDir, filename);

        fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`📄 임시 JSON 파일 생성: ${localPath}`);

        await uploadToSFTP(localPath, filename);

        // 업로드 성공하면 삭제
        fs.unlinkSync(localPath);
        console.log(`🧹 임시 파일 삭제 완료: ${localPath}`);
    } catch (err) {
        console.error('❌ 전체 처리 실패:', err);
    }
};
