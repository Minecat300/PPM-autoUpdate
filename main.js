import fs from "fs";
import path from "path";
import minimist from "minimist";
import chalk from "chalk";
import ora from "ora";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

chalk.orange = chalk.rgb(255, 81, 0)
chalk.trueCyan = chalk.rgb(39, 185, 232);

if (!fs.existsSync("./updateData.json")) {
    fs.writeFileSync("./updateData.json", JSON.stringify({}, null, 2)); 
}

function addAutoUpdateFromPackage(pkg) {
    try {
        if (!pkg.autoUpdate) throw chalk.orange("Package missing auto update");
        if (!pkg.autoUpdate.fromVersion && !pkg.autoUpdate.githubWebhook) throw chalk.orange("Package missing version or webhook update");

        const data = JSON.parse(fs.readFileSync("./updateData.json"));
        data[pkg.name] = pkg.autoUpdate;

        if (pkg.autoUpdate.fromVersion) {

        }
        if (pkg.autoUpdate.githubWebhook) {
            data[pkg.name].githubWebhook.secretPath = path.join(__dirname, "githubWebhookSecret.txt");
        }

        fs.writeFileSync("./updateData.json", JSON.stringify(data, null, 2));
    } catch (err) {
        throw(err);
    }
}

function addFromPath(dir) {
    try {
        if (!dir) throw chalk.orange("Path missing");

        const packagePath = path.join(dir, "package.json");
        if (!fs.existsSync(packagePath)) throw chalk.orange("package.json was not found");
        
        const pkg = JSON.parse(fs.readFileSync(packagePath));
        addAutoUpdateFromPackage(pkg);

    } catch (err) {
        throw(err);
    }
}

function main() {
    try {
        const args = minimist(process.argv.slice(2), {
            boolean: []
        });

        const command = args._[0];

        if (command == "add") {
            addFromPath(args._[1]);
            return;
        }
        if (command == "help" || command == "h" || command == "?" || !command) {
            console.log(chalk.trueCyan("add"), "<Package Path>");
            return;
        }
        console.log(chalk.trueCyan("Unknown Command"));

    } catch (err) {
        console.error(err);
    }
}

main();
