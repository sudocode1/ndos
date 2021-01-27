// dependencies
const fs = require("fs");
const prompt = require("prompt-sync")();
const fetch = require("node-fetch");
const crypto = require("crypto");
let reg = require(`./registry.json`);
let users = JSON.parse(fs.readFileSync(`./users.json`, `utf-8`));

// data
let build = Buffer.from(reg.DATA["BUILD"], "base64").toString();
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
    console.log(`Welcome to NDOS ${build} ${version}`);
    blueprint && console.log(`\x1b[31mThis version of NDOS is a blueprint! Use at your own risk`);
    console.log("\x1b[0m");
}

async function boot() {
    // clear
    clear();

    // login
    let user = prompt(`Username: `);
    let pass = prompt(`Password: `);
    let word = require('crypto').createHash('sha256').update(pass).digest('base64');
    if (!users[user]) {console.log("Username invalid."); process.exit();}
    let p = users[user].password;
    if (p !== word) {console.log("Your password is incorrect!"); process.exit();};

    if (users[user]["adminstrator"] == true && reg.USERS["ROOT_USER_WARNING"] == 1) {
        console.log(`\x1b[31mYou are running with elevated priviliges. Continue with caution.`);
    }

    console.log("\x1b[0m");

    let ver;

    await fetch(`http://ndosrepos.7m.pl/v.txt`)
    .then(res => res.text())
    .then(body => ver = body);

    if (ver !== reg.DATA["VERSION"]) console.log(`\x1b[32mA new version is available: ${Buffer.from(ver, "base64").toString()}\x1b[0m (Stable)`);
    
    // var
    let bootscripts = false;
    let devNotes = true;

    // search for boot folder
    try {fs.readdirSync(`./boot`); bootscripts = true;} catch(e) {console.log(` No boot folder found!`); bootscripts = false;};

    reg.BOOT["DISABLE_BOOT_SCRIPTS"] !== 0 ? bootscripts = false : null;
    reg.BOOT["DISABLE_DEVELOPER_NOTES"] !== 0 ? devNotes = false : null;

    // developer notes
    if (devNotes == true) {
        console.log("Join the Community Discord!\nReport bugs, suggest features and chat with other users!\nhttps://discord.gg/kg96m6AvpZ");
        console.log(`directories are currently disabled in mount/unmount (alpha-0.6.1 and above)`);
        console.log(`developed by sudocode1, 1s3k3b and JBMagination`);
        console.log(`Release ${version}, ${date}`);
    }

    // modification notes
    if (reg.DATA.MODIFICATION["MODIFIED"] === true) {
        console.log(`This build of NDOS ${build} is modified`);
        console.log(`Modified by: ${reg.DATA.MODIFICATION["MODIFIED_BY"]}`)
    }

    // boot scripts
    if (bootscripts === true) {
        console.log(`\x1b[33mRunning Boot Scripts`)
        console.log("\x1b[0m");

        fs.readdirSync(`./boot`).map(x => eval(fs.readFileSync(`./boot/${x}`, `utf-8`)));
        console.log();
    }

    nd(user);
}

boot();

// script
async function nd(u) {
    // cmd split
    let cmd = prompt(`${u}@${build}>`);
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
            let driveExists = true;
            try {fs.readFileSync(`./drives/${spl[1]}/compress.txt`); driveExists = true;} catch(e) {driveExists = false; try {fs.mkdirSync(`./drives/${spl[1]}`);} catch(e) {driveInvalid = true;}};
            if (driveExists == true) {
                console.log(`The drive ${spl[1]} already exists.`);
            }
            else {
                if (driveInvalid = true) {
                    console.log("This drive uses invalid characters.")
                }
                else {    
            fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, ``);
            console.log(`${spl[1]} has been created & mounted.`);
        }
    }
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
                console.log("Downloading file...")
                await fetch(`http://ndosrepos.7m.pl/${spl[1]}.js`)
                .then(res => res.text())
                .then(body => fs.writeFileSync(`./commands/${spl[1]}.js`, body))
                .then(console.log(`Downloaded. Run "${spl[1]}" in NDOS to try it out.`))
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
                console.log("Downloading file...")
                await fetch(`http://${address}/${spl[2]}.js`)
                .then(res => res.text())
                .then(body => fs.writeFileSync(`./commands/${spl[2]}.js`, body))
                .then(console.log(`Downloaded. Run "${spl[2]}" in NDOS to try it out.`))
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
        let cont = true;
        if (users[u]["adminstrator"] !== true) {cont = false};

        if (cont == true) {
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
        } else {
            console.log(`BUS requires Administrator Privilgies`);
        }

    }
	
    else if(cmd.startsWith(`reboot`) || cmd.startsWith(`logout`)) {return boot();}

    else if (cmd.startsWith(`newuser`)) {
        let user = prompt("username: ");
        let name = prompt("name: ")
        let password = prompt("password: ");
        let cont = true;

        users[user] ? (console.log(`This user already exists!`), cont = false) : null;
        
        if (cont == true) {
            users[user] = {
                name: name,
                password: require('crypto').createHash('sha256').update(password).digest('base64')
            }

            fs.writeFileSync(`./users.json`, JSON.stringify(users));
            console.log(`New user created: ${user}`);
        }

    }

    else if(cmd.startsWith(`lock`)) {
        let cont = false;
        
        let password = prompt(`${u} password: `);

        if (require('crypto').createHash('sha256').update(password).digest('base64') == users[u].password) cont = true;

        if (cont == true) null
        else {
            console.log(`\nPassword Incorrect!`);

            let password2 = prompt(`${u} password: `);

            if (require('crypto').createHash('sha256').update(password2).digest('base64') == users[u].password) cont = true;


            if (cont == true) null
            else {
                console.log(`\nPassword Incorrect!`);

                let password3 = prompt(`${u} password: `);
    
                if (require('crypto').createHash('sha256').update(password3).digest('base64') == users[u].password) cont = true;
    
                if (cont == true) null;
                else {console.log(`\nPassword Incorrect!`); process.exit();}
            }
        }

    }

    // custom commands
    else {
        try {fs.readdirSync(`./commands`)} catch(e) {console.log(`This command does not exist!`)};
        fs.readdirSync(`./commands`).includes(`${cmd}.js`) ? eval(fs.readFileSync(`./commands/${cmd}.js`, `utf-8`)) : console.log("This command does not exist!");
    }

    // bus
    if (reg.BUS["DISABLE_CMD_LOGGING"] !== 1) {
        fs.appendFileSync(`./bus/recentcmds.txt`, `${cmd} ${Date.now()}\n`);

        if (users[u].adminstrator !== true) {}
        else if (reg.BUS["DISABLE_CMD_LOGGING_NOTIFICATION"] !== 1) {console.log(`BUS_CMD_LOGGING has logged ${cmd} to /bus/recentcmds.txt`)};
    }

    console.log();
    nd(u);
};
