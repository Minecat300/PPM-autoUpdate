import fs from "fs";
import path from "path";
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

import { execSync, exec } from "child_process";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const updateDataPath = path.join(__dirname, "updateData.json");

if (!fs.existsSync(updateDataPath)) {
    fs.writeFileSync(updateDataPath, JSON.stringify({}, null, 2)); 
}

const app = express();
const PORT = 53741;

app.use(bodyParser.json({
    verify: (req, res, buf) => { req.rawBody = buf }
}));

app.post('/', (req, res) => {
    const event = req.headers['x-github-event'];
    if (event !== 'push') return res.status(200).send('Ignored non-push event');

    const repoFullName = req.body.repository.full_name;
    const branch = req.body.ref.replace('refs/heads/', '');

    const packages = JSON.parse(fs.readFileSync(updateDataPath));
    const packageName = Object.entries(packages).find(([topKey, nestedObj]) => nestedObj.githubWebhook?.repo === repoFullName)?.[0];

    if (!packageName) return res.status(200).send('Repo not tracked');
    const repoConfig = packages[packageName].githubWebhook;

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return res.status(401).send('No signature');

    const secret = fs.readFileSync(repoConfig.secretPath, 'utf8').trim();
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        return res.status(401).send('Invalid signature');
    }

    const branches = Array.isArray(repoConfig.branch)
        ? repoConfig.branch
        : [repoConfig.branch];

    if (branches.includes(branch)) {
        console.log(`Push detected on ${repoFullName} branch ${branch}`);
        req.body.commits.forEach(c => console.log(`- ${c.message}`));

        try {
            execSync(`sudo ppm update ${packageName}`, { stdio: 'inherit' });
        } catch(err) {
            console.error("Error updating:", err.message);
        }

        return res.status(200).send('Push processed');
    }

    res.status(200).send('Branch ignored');
});

app.listen(PORT, () => {
    console.log(`Webhook listener running on port ${PORT}`);
});