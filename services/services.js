import fetch from "node-fetch";
import fs from 'fs';
import path from "path";
import ftp from 'basic-ftp';
import {TOKEN_URL,AIRCRAFT_ALL_URL} from '../constant/apiConstant';

//opensky file open token
const getAccessToken = async () => {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.OPENSKY_CLIENT_ID);
        params.append('client_secret', process.env.OPENSKY_CLIENT_SECRET);

        const response = await fetch(TOKEN_URL, {
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

//opensky
const getAllAircraftList = async () => {
    try {
        const token = await getAccessToken();

        const headers = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        const response = await fetch(AIRCRAFT_ALL_URL, {
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

        fs.mkdirSync(tempDir, { recursive: true });

        const localPath = path.resolve(tempDir, filename);
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`📄 임시 JSON 파일 생성: ${localPath}`);

        await uploadToSFTP(localPath, filename);

        // 업로드 성공하면 삭제
        try {
            fs.unlinkSync(localPath);
            console.log(`🧹 임시 파일 삭제 완료: ${localPath}`);
        } catch (deleteErr) {
            console.error(`❌ 임시 파일 삭제 실패: ${localPath}`, deleteErr);
        }

        // 오래된 파일 삭제
        const files = fs.readdirSync(tempDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => {
                const aTime = parseInt(a.replace('.json', ''));
                const bTime = parseInt(b.replace('.json', ''));
                return bTime - aTime;
            });

        if (files.length > 100) {
            const filesToDelete = files.slice(100);
            for (const file of filesToDelete) {
                const filePath = path.resolve(tempDir, file);
                try {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ 오래된 파일 삭제: ${filePath}`);
                } catch (err) {
                    console.error(`❌ 파일 삭제 실패: ${filePath}`, err);
                }
            }
        }

    } catch (err) {
        console.error('❌ 전체 처리 실패:', err);
    }
};