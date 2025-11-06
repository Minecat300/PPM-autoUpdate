import fs from "fs";
import path from "path";

if (!fs.existsSync("./updateData.json")) {
    fs.writeFileSync("./updateData.json", JSON.stringify({}, null, 2)); 
}

