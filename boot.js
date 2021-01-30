// dependencies
const fs = require("fs");
const prompt = require("prompt-sync")();
const fetch = require("node-fetch");
let reg = require(`./registry.json`);

// data
let version = Buffer.from(reg.DATA["VERSION"], "base64").toString();
let date = Buffer.from(reg.DATA["DATE"], "base64").toString();
let blueprint = reg.DATA["BLUEPRINT"];

// boot
try {fs.readdirSync(`./commands`)} catch(e) {fs.mkdirSync(`commands`)};
try {fs.readdirSync(`./drives`)} catch(e) {fs.mkdirSync(`drives`)};
try {fs.readdirSync(`./boot`)} catch(e) {fs.mkdirSync(`boot`)};
try {fs.readdirSync(`./shutdown`)} catch(e) {fs.mkdirSync(`shutdown`)};
try {fs.readdirSync(`./bus`)} catch(e) {fs.mkdirSync(`bus`)};
try {fs.readFileSync(`./bus/recentcmds.txt`, `utf-8`)} catch(e) {fs.writeFileSync(`./bus/recentcmds.txt`, ``)};


function clear() {
    console.clear();
    console.log(` Welcome to NDOS ${version}`);
    blueprint && console.log(`\x1b[31m`, `This version of NDOS is a blueprint! Use at your own risk`);
    console.log("\x1b[0m");
}

async function boot() {
    clear();

    let ver;

    await fetch(`http://ndosrepos.7m.pl/v.txt`)
    .then(res => res.text())
    .then(body => ver = body);

    if (ver !== reg.DATA["VERSION"]) console.log(`A new version is available: ${Buffer.from(ver, "base64").toString()}`);

    
    let bootscripts = false;
    let devNotes = true;

    try {fs.readdirSync(`./boot`); bootscripts = true;} catch(e) {console.log(` No boot folder found!`); bootscripts = false;};

    reg.BOOT["DISABLE_BOOT_SCRIPTS"] !== 0 ? bootscripts = false : null;
    reg.BOOT["DISABLE_DEVELOPER_NOTES"] !== 0 ? devNotes = false : null;

    if (devNotes == true) {
        console.log("Join the Community Discord!\nReport bugs, suggest features and chat with other users!\nhttps://discord.gg/kg96m6AvpZ")
        console.log(`directories are currently disabled in mount/unmount (alpha-0.6.1 and above)`);
        console.log(`developed by sudocode1 and 1s3k3b`);
        console.log(`Release ${version}, ${date}`);
    }

    if (reg.DATA.MODIFICATION["MODIFIED"] === true) {
        console.log(`This build of NDOS is modified`);
        console.log(`Modified by: ${reg.DATA.MODIFICATION["MODIFIED_BY"]}`)
    }

    if (bootscripts === true) {
        console.log(`\x1b[33mRunning Boot Scripts`)
        console.log("\x1b[0m");

        fs.readdirSync(`./boot`).map(x => eval(fs.readFileSync(`./boot/${x}`, `utf-8`)));
        console.log();
    }

    nd();
}

boot();

// script
async function nd() {
    // cmd split
    let cmd = prompt(`ndos>`);
    let spl = cmd.split(" ");

    // commands
    if (cmd.startsWith(`help`)) {
        let cmds = [];
        let c = [];

        cmds = Object.entries(reg.HELP_CMD);

        cmds.map(x => {
            if (x[1][0] == 1) c.push([x[1][1], x[1][2]]); 
        });

        console.log(`Commands in NDOS ${version}`);
        c.map(x => console.log(`${x[0]}: ${x[1]}`));
    }

    else if (cmd.startsWith(`dir`)) {
        try {!spl[1] ? console.log(fs.readdirSync(reg.DIR_CMD["DEFAULT_DIRECTORY"]).join("\n")) : (console.log(fs.readdirSync(spl[1]).join(`\n`)));}
        catch (e) {console.log(`There was an error accessing this directory.`)};
    }

    else if (cmd.startsWith(`exit`)) {
        let scripts = true;
        if (reg.SHUTDOWN["DISABLE_SHUTDOWN_SCRIPTS"] !== 0) {scripts = false;};
        if (scripts == true) {
            fs.readdirSync(`./shutdown`).map(x => {
                eval(fs.readFileSync(`./shutdown/${x}`, `utf-8`));
            });

        }
        process.exit();
    }

    else if (cmd.startsWith(`clear`)) {clear()}

    else if (cmd.startsWith(`write`)) {
        let file = prompt("File? ");
        let data = prompt("Text: ");

        let override = false;

        try {fs.readFileSync(`${file}`); override = true;} catch(e) {override = false;};

        if (override == true) {
            let cont = prompt("This file already exists and the data will be overriden, are you sure [Y/N]? ");

            if (cont == `Y`) {fs.writeFileSync(file, data); console.log(`Written to ${file}!`);}
            else if (cont == `N`) {}
            else {console.log(`Invalid`);};
        } else {
            fs.writeFileSync(file, data);
            console.log(`Written to ${file}!`);
        }
    }

    else if (cmd.startsWith(`read`)) {
        let file;
        
        if(!spl[1]) file = prompt(`File to read? `);
        else file = spl[1];

        try {console.log(fs.readFileSync(file, `utf-8`))} catch (e) {console.log(`This file failed to read.`)};
    }

    else if (cmd.startsWith(`execute`)) {
        let toExc;
        let cont = false;

        if(!spl[1]) toExc = prompt(`File to execute? `);
        else toExc = spl[1];

        try { fs.readFileSync(toExc); cont = true; } catch (e) { console.log("The file failed to read."); cont = false; };

        if (cont === true) {
            try {eval(fs.readFileSync(toExc, `utf-8`))} catch(e) {console.log(e)};
        }
    }

    else if (cmd.startsWith(`newdrive`)) {
        if (!spl[1]) console.log(`Argument unsatisfied.`)

        else {
            fs.mkdirSync(`./drives/${spl[1]}`);
            fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, ``);
            console.log(`${spl[1]} has been created & mounted.`);
        };
    }

    else if (cmd.startsWith(`mount`)) {
        if (!spl[1]) console.log(`Argument unsatisfied.`)
        else {
            let cont;

            try {fs.readFileSync(`./drives/${spl[1]}/compress.txt`, `utf-8`); cont = true;} catch(e) {console.log("There was an error reading the compression."); cont = false;};
            
            if (cont == true) {
                let file = fs.readFileSync(`./drives/${spl[1]}/compress.txt`, `utf-8`).toString();
                let f = file.split("|");

                function check(toCheck, drive) {
                    let split = toCheck.split(`,`);

                    if(split[0] == `file`) {
                        fs.writeFileSync(`./drives/${drive}/${split[1]}`, Buffer.from(split[2], "base64").toString());
                    }
                }

                f.map(x => check(x, spl[1]));
                
            }
            else null;

        }
    }

    else if (cmd.startsWith(`unmount`)) {
        if (!spl[1]) console.log(`Argument unsatisfied.`)
        else {
            let cont;
            let str = "";

            try {fs.readdirSync(`./drives/${spl[1]}`); cont = true;} catch(e) {cont = false;};

            if (cont == true) {
                fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, "");
                fs.readdirSync(`./drives/${spl[1]}`).map(x => {
                    if (x == `compress.txt`) return;
                    let result;

                    try {fs.readFileSync(`./drives/${spl[1]}/${x}`, `utf-8`); result = "f";}
                    catch(e) {console.log(`${x} is a directory.\nDirectories are not currently supported.`); result = "d"}
                    finally {if (result === "f") {
                        str += `file,${x},` + Buffer.from(fs.readFileSync(`./drives/${spl[1]}/${x}`, `utf-8`).toString()).toString("base64") + `|`;
                        fs.rmSync(`./drives/${spl[1]}/${x}`);
                    }};

                });

                fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, str);
            }
            else null;


        }
    }

    else if (cmd.startsWith(`jpac`)) {
        let cont = true;
        if (reg.DATA["GO_ONLINE"] == false) {cont = false; console.log(`DATA.GO_ONLINE is disabled! Change it in the registry.`)};

        if (cont == true) {
            try {
                await fetch(`http://ndosrepos.7m.pl/${spl[1]}.js`)
                .then(res => res.text())
                .then(body => fs.writeFileSync(`./commands/${spl[1]}.js`, body));
            } catch(e) {
                console.log("There was most likely a network error.");
            }


        }
        
    }

    else if (cmd.startsWith(`pacman`)) {
        let address = spl[1];
        let cont = true;
        if (reg.DATA["GO_ONLINE"] == false) {cont = false; console.log(`DATA.GO_ONLINE is disabled! Change it in the registry.`)};
        

        if (cont == true) {
            if (spl[1] == `default`) {
                address = reg.PACMAN_CMD["DEFAULT_ADDRESS"];
                console.log(`Using default address: ${reg.PACMAN_CMD["DEFAULT_ADDRESS"]}\nChange in registry options.`);
            }
    
            try {
                await fetch(`http://${address}/${spl[2]}.js`)
                .then(res => res.text())
                .then(body => fs.writeFileSync(`./commands/${spl[2]}.js`, body))
            } catch (e) {
                console.log("There was most likely a network error.");
            }
        }
    }

    else if (cmd.startsWith(`echo`)) {
        console.log(spl.slice(1).join(" "));
    }

    else if (cmd.startsWith(`eval`)) {
        eval(spl.slice(1).join(" "));
    }

    else if (cmd.startsWith(`bus`)) {

        switch(spl[1]) {
            case "read":
                console.log(fs.readFileSync(`./bus/recentcmds.txt`, `utf-8`));
            break;

            case "clear":
                console.log(fs.writeFileSync(`./bus/recentcmds.txt`, ``));
            break;

            case "write": 
                console.log(fs.appendFileSync(`./bus/recentcmds.txt`, `${spl.slice(2).join(" ")}\n`));
            break;
        }
    }

    // custom commands
    else {
        try {fs.readdirSync(`./commands`)} catch(e) {console.log(`This command does not exist!`)};
        fs.readdirSync(`./commands`).includes(`${cmd}.js`) ? await eval(`(async () => {${fs.readFileSync(`./commands/${cmd}.js`, `utf-8`)}})();`) : console.log("This command does not exist!");
    }

    // bus
    if (reg.BUS["DISABLE_CMD_LOGGING"] !== 1) {
        fs.appendFileSync(`./bus/recentcmds.txt`, `${cmd} ${Date.now()}\n`);

        if (reg.BUS["DISABLE_CMD_LOGGING_NOTIFICATION"] !== 1) console.log(`BUS_CMD_LOGGING has logged ${cmd} to /bus/recentcmds.txt`);
    }

    console.log();
    nd();
};