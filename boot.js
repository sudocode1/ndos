// dependencies
const fs = require("fs");
const prompt = require("prompt-sync")();
const fetch = require("node-fetch");
const { Client: FTPClient } = require('basic-ftp');
const menu = require("console-menu");
const { findBestMatch } = require("string-similarity");
const { execSync } = require("child_process");
const { join } = require("path");

// functions
function criticalError(e = "UNSPECIFIED_ERROR", extra = "NO_EXTRA_INFORMATION") {
    let total = 0; while(total < 5){console.log("\n"); total++};
    console.log(`\x1b[31mCRITICAL ERROR: ${e}\nMore info: ${extra}`);
    total = 0; while(total < 5){console.log("\n"); total++};
    process.exit();
};

process.on('unhandledRejection', (reason, promise) => {
    criticalError("UNHANDLED_NODE_ERROR", reason);
});

// crit data check
try {fs.readFileSync(`./registry.json`); fs.readFileSync(`./users.json`)}
catch(e) {criticalError("CRITICAL_DATA_MISSING", e)};

// crit data
let reg = require(`./registry.json`);
let users = require(`./users.json`);

// data
let build = Buffer.from(reg.DATA["BUILD"], "base64").toString();
let version = Buffer.from(reg.DATA["VERSION"], "base64").toString();
let date = Buffer.from(reg.DATA["DATE"], "base64").toString();
let blueprint = reg.DATA["BLUEPRINT"];
let start = reg.START_MENU["START_DEFAULT"];

// boot
try {fs.readdirSync(`./commands`)} catch(e) {fs.mkdirSync(`commands`)};
try {fs.readdirSync(`./drives`)} catch(e) {fs.mkdirSync(`drives`)};
try {fs.readdirSync(`./boot`)} catch(e) {fs.mkdirSync(`boot`)};
try {fs.readdirSync(`./shutdown`)} catch(e) {fs.mkdirSync(`shutdown`)};
try {fs.readdirSync(`./bus`)} catch(e) {fs.mkdirSync(`bus`)};
try {fs.readFileSync(`./bus/recentcmds.txt`, `utf-8`)} catch(e) {fs.writeFileSync(`./bus/recentcmds.txt`, ``)};

let vars = {};
let operatingDirectory = "./";
let fontColor = "\x1b[0m";
let bgColor = "\x1b[0m";


function clear() {
    console.clear();
    console.log(`Welcome to NDOS ${build} ${version}`);
    blueprint && console.log(`\x1b[31mThis version of NDOS is a blueprint! Use at your own risk`);
    console.log("\x1b[0m");
}

function avScan(toScan) {
    toScan = toScan.toString();
    let result = [];

    let scanArray = ["rmSync", "rm", "rmdirSync", "rmdir", "writeFile", "writeFileSync", "boot.js", "boot", "users", "registry"];

    scanArray.some(x => {
        if (toScan.includes(x)) {result.push(x)};
    });

    return result;
}

async function boot() {
    // clear
    clear();

    // login
    let uList = [];
    uList = Object.entries(users);

    let user;
    let userArray = Array.from({ length: Math.min(uList.length, 9) }, (_, i) => ({ hotkey: i + '', title: uList[i][0] }));
    userArray.push({ separator: true });
    userArray.push({ hotkey: "?", title: "Other user" })

    await menu(userArray, {header: "Login Menu", border: true})
    .then(item => {
        if (item && item.title == "Other user") {user = prompt("Username: ")}
        else if (item) user = item.title
        else {console.log("Menu Cancelled"); process.exit();}
    });
    


    let pass = prompt(`Password: `);
    let word = require('crypto').createHash('sha256').update(pass).digest('base64');
    if (!users[user]) {console.log("Username invalid."); process.exit();}
    let p = users[user].password;
    if (p !== word) {console.log("Your password is incorrect!"); process.exit();};

    // admin warn
    if (users[user]["administrator"] == true && reg.USERS["ROOT_USER_WARNING"] == 1) {
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

        fs.readdirSync(`./boot`).map(x => {if (!x.endsWith(`js`)) return; eval(fs.readFileSync(`./boot/${x}`, `utf-8`))});
        console.log();
    }

    console.log(`Welcome Back, ${users[user].name}\n`);
    nd(user);
}

boot();

// script
async function nd(u) {
    let cmd;
    
    if (start == true) {
        let menuList = Array.from({ length: Math.min(reg.START_MENU["COMMANDS"].length, 9) }, (_, i) => ({ hotkey: i + '', title: reg.START_MENU["COMMANDS"][i] }));
        menuList.push({ separator: true });
        menuList.push({ hotkey: ">", title: "Enter terminal command"});
        menuList.push({ hotkey: "?", title: "Back to terminal" });

        await menu(menuList, {header: `Start Menu (${operatingDirectory})`, border: true})
        .then(item => {
            if (item && item.title == "Back to terminal") {start = false; cmd = prompt(`${u}@${build}>`)}
            else if (item && item.title == "Enter terminal command") {cmd = prompt(`${u}@${build}>`)}
            else if (item) {cmd = item.title}
            else {cmd = prompt(`${u}@${build}>`)}
        });
    } else if (start == false) {cmd = prompt(`${u}@${build}${operatingDirectory}>`)};


    // cmd split
    let spl = cmd.split(" ");

    // commands
    if (cmd.startsWith(`help`)) {
        let cmds = [];
        let c = [];

        cmds = Object.entries(reg.HELP_CMD);

        cmds.map(x => {
            if (x[1][0] == 1) c.push([x[1][1], x[1][2]]); 
        });

        console.log(`Commands in NDOS ${build} ${version}`);
        c.map(x => console.log(`${x[0]}: ${x[1]}`));
    }

    else if (cmd.startsWith(`dir`)) {
        try {!spl[1] ? console.log(fs.readdirSync(operatingDirectory).join("\n")) : (console.log(fs.readdirSync(operatingDirectory + spl[1]).join(`\n`)));}
        catch (e) {console.log(`There was an error accessing this directory.`)};
    }

    else if (cmd.startsWith(`exit`)) {
        let scripts = true;
        if (reg.SHUTDOWN["DISABLE_SHUTDOWN_SCRIPTS"] !== 0) {scripts = false;};
        if (scripts == true) {
            fs.readdirSync(`./shutdown`).map(x => {
                if (!x.endsWith(`js`)) return;
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

        try {fs.readFileSync(`${operatingDirectory}${file}`); override = true;} catch(e) {override = false;};

        if (override == true) {
            let cont = prompt("This file already exists and the data will be overriden, are you sure [Y/N]? ");

            if (cont == `Y`) {fs.writeFileSync(operatingDirectory + file, data); console.log(`Written to ${file}!`);}
            else if (cont == `N`) {}
            else {console.log(`Invalid`);};
        } else {
            fs.writeFileSync(operatingDirectory + file, data);
            console.log(`Written to ${file}!`);
        }
    }

    else if (cmd.startsWith(`read`)) {
        let file;
        
        if(!spl[1]) file = prompt(`File to read? `);
        else file = spl[1];

        try {console.log(fs.readFileSync(operatingDirectory + file, `utf-8`))} catch (e) {console.log(`This file failed to read.`)};
    }

    else if (cmd.startsWith(`execute`)) {
        let toExc;
        let cont = false;

        if(!spl[1]) toExc = prompt(`File to execute? `);
        else toExc = spl[1];

        try { fs.readFileSync(operatingDirectory + toExc); cont = true; } catch (e) { console.log("The file failed to read."); cont = false; };

        if (cont === true) {
            try {eval(fs.readFileSync(operatingDirectory + toExc, `utf-8`))} catch(e) {console.log(e)};
        }
    }

    else if (cmd.startsWith(`newdrive`)) {
        if (!spl[1]) console.log(`Argument unsatisfied.`)

        else {
            if (/^[a-z]$/.test(spl[1]) == false) {console.log("Invalid char")}
            else {
                let driveExists = true;
                let driveInvalid = false;
                try {fs.readFileSync(`./drives/${spl[1]}/compress.txt`); driveExists = true;} 
                catch(e) {driveExists = false; try {fs.mkdirSync(`./drives/${spl[1]}`);} catch(e) {driveInvalid = true; console.log(e)}};
    
    
                if (driveExists == true) {
                    console.log(`The drive ${spl[1]} already exists.`);
                }
                else {
                    if (driveInvalid == true) {
                        console.log("This drive uses invalid characters.")
                    }
                    else {    
                fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, ``);
                console.log(`${spl[1]} has been created & mounted.`);
            }
        }
            };
            
            }

    }

    else if (cmd.startsWith(`mount`)) {
        let dr;
        let driveList = fs.readdirSync(`./drives`);
        const dList = driveList.filter(x => x !== '.');


        let menuArr = Array.from({ length: Math.min(dList.length, 9) }, (_, i) => ({ hotkey: i + '', title: dList[i][0] }));
        menuArr.push({ separator: true });
        menuArr.push({ hotkey: "?", title: "Other drive" });

        if (!spl[1]) {
            await menu(menuArr, {header: "Drive Menu", border: true})
            .then(item => {
                if (item && item.title == "Other drive") {
                    dr = prompt("Drive: ");

                    if (!/^[a-z]$/.test(dr)) criticalError("ILLEGAL_DRIVE_OPERATION");
                } else if(item) {
                    dr = item.title;

                    if (!/^[a-z]$/.test(dr)) criticalError("ILLEGAL_DRIVE_OPERATION");
                } else {console.log(dr = "leave")}
            })
        } else {dr = spl[1]};

        let cont;

        try {fs.readFileSync(`./drives/${dr}/compress.txt`, `utf-8`); cont = true;} catch(e) {console.log("There was an error reading the compression."); cont = false;};
            
        if (cont == true) {
            let file = fs.readFileSync(`./drives/${dr}/compress.txt`, `utf-8`).toString();
            let f = file.split("|");

            function check(toCheck, drive) {
                let split = toCheck.split(`,`);

                if(split[0] == `file`) {
                    fs.writeFileSync(`./drives/${drive}/${split[1]}`, Buffer.from(split[2], "base64").toString());
                }
            }

            f.map(x => check(x, dr));
                
        }
        else null;

    }
    

    else if (cmd.startsWith(`unmount`)) {
        let dr;
        let driveList = fs.readdirSync(`./drives`);
        const dList = driveList.filter(x => x !== '.');


        let menuArr = Array.from({ length: Math.min(dList.length, 9) }, (_, i) => ({ hotkey: i + '', title: dList[i][0] }));
        menuArr.push({ separator: true });
        menuArr.push({ hotkey: "?", title: "Other drive" });

        if (!spl[1]) {
            await menu(menuArr, {header: "Drive menu", border: true}).then(item => {
                if (item && item.title == "Other drive") {
                    dr = prompt("Drive: ");
                    if (!/^[a-z]$/.test(dr)) criticalError("ILLEGAL_DRIVE_OPERATION");
                } else if(item) {
                    dr = item.title;

                    if (!/^[a-z]$/.test(dr)) criticalError("ILLEGAL_DRIVE_OPERATION");
                } else {console.log(dr = "leave")}
            });
        } else {dr = spl[1]};

        let cont;
        let str = "";

        try {fs.readdirSync(`./drives/${dr}`); cont = true;} catch(e) {cont = false;};

        if (cont == true) {
            fs.writeFileSync(`./drives/${dr}/compress.txt`, "");
            fs.readdirSync(`./drives/${dr}`).map(x => {
                if (x == `compress.txt`) return;
                let result;

                try {fs.readFileSync(`./drives/${dr}/${x}`, `utf-8`); result = "f";}
                catch(e) {console.log(`${x} is a directory.\nDirectories are not currently supported.`); result = "d"}
                finally {if (result === "f") {
                    str += `file,${x},` + Buffer.from(fs.readFileSync(`./drives/${dr}/${x}`, `utf-8`).toString()).toString("base64") + `|`;
                    fs.rmSync(`./drives/${dr}/${x}`);
                }};

            });

            fs.writeFileSync(`./drives/${dr}/compress.txt`, str);
        }
        else null;


        
    }

    else if (cmd.startsWith(`jpac`)) {
        let cont = true;
        if (reg.DATA["GO_ONLINE"] == false) {cont = false; console.log(`DATA.GO_ONLINE is disabled! Change it in the registry.`)};

        if (cont == true) {
            const all = await fetch('http://ndosrepos.7m.pl/packages')
                .then(d => d.text())
                .then(d => d.match(/(?<=<a href=")[^\."]+(?=\.[^\."]+">)/g));
            const closest = findBestMatch(spl[1] || '', all).bestMatch;
            const name = closest.rating < 0.7
                ? await menu(
                    all.map((x, i) => ({ hotkey: i + 1 + '', title: x })),
                    { header: 'JPAC Packages', border: true },
                ).then(d => d && d.title)
                : closest.target;
            if (!name) console.log('No package selected.');
            else {
                const code = await fetch(`http://ndosrepos.7m.pl/${name}.js`).then(d => d.text());
                const deps = await fetch(`http://ndosrepos.7m.pl/packages/${name}.txt`).then(d => d.json());
                fs.writeFileSync(`./commands/${name}.js`, code);
                if (deps.length) execSync(`npm i ${deps.join(' ')}`);
                console.log(`Successfully installed ${name}.`);
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

                let r = avScan(fs.readFileSync(`./commands/${spl[2]}.js`, `utf-8`));
                if (r.length !== 0) {
                    console.log("NDOS Protection has triggered the following warnings:");
                    console.log(r.join("\n"));
                    console.log("Proceed with caution.");
                }


                console.log(`Downloaded. Run "${spl[2]}" in NDOS to try it out.`)
            } catch (e) {
                console.log("There was most likely a network error.");
            }
        }
    }

    else if (cmd.startsWith(`echo`)) {
        console.log(spl.slice(1).join(" "));
    }

    else if (cmd.startsWith(`eval`)) {
        try {eval(spl.slice(1).join(" "));}
        catch (e) {console.log(e)};
    }

    else if (cmd.startsWith(`bus`)) {
        let cont = true;
        if (users[u]["administrator"] !== true) {cont = false};

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

        users[u].administrator !== true ? (console.log(`You do not have permission`), cont = false) : null;
        users[user] ? (console.log(`This user already exists!`), cont = false) : null;

        password = password.trim();
        
        if (cont == true) {
            users[user] = {
                name: name,
                password: require('crypto').createHash('sha256').update(password).digest('base64'),
                administrator: false
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

    else if (cmd.startsWith(`start`)) {
        console.log("Swapping to the start menu.");
        start = true;
    }

    else if (cmd.startsWith(`rm`)) {
        let cont = true;

        users[u].administrator !== true ? (console.log("You do not have permission"), cont = false) : null;
        operatingDirectory == `./` && spl[3] !== "--force" ? (console.log(`Operating on / is dangerous. Add --force to ignore this.`), cont = false) : null;

        if (cont == true) {
            switch(spl[1]) {
                case "-f":
                    try {console.log(`Removing...`); fs.rmSync(`${operatingDirectory}${spl[2]}`);} catch(e) {console.log(`There was an error.`)};
                break;
    
                case "-d":
                    try {console.log(`Removing...`); fs.rmdirSync(`${operatingDirectory}${spl[2]}`);} catch(e) {console.log(`There was an error.`)};
                break;
    
                default:
                    console.log("Invalid!");
            }
        }
    }

    else if (cmd.startsWith(`av`)) {
        let noError = true;
        try {fs.readFileSync(operatingDirectory + spl[2], `utf-8`)}
        catch(e) {noError = false};

        if (noError == true) {
            switch (spl[1]) {
                case "scan":
                    let r = avScan(fs.readFileSync(operatingDirectory + spl[2], `utf-8`));
    
                    if (r.length == 0) console.log(`There were no issues found. This file should be safe to run.`)
                    else {
                        console.log(`\x1b[31mWarning!\x1b[37m Issues were found!`);
                        r.map(x => console.log(x));
                        console.log(fontColor, bgColor);
                    }
                break;
    
                case "info": 
                    reg.DATA.AV["AV_INFO"].map(x => console.log(x));
                break;
            }
        } else {console.log("File does not exist!")};
    }

    else if (cmd.startsWith(`attrib`)) {
        if (!spl[1]) console.log(reg.HELP_CMD.ATTRIB_SHOWN[1])
        else {
            let obj = Object.entries(fs.statSync(operatingDirectory + spl[1]));

            obj.map(x => console.log(x[0] + ": ", x[1]));
        }
    }

    else if (cmd.startsWith(`date`)) {
        console.log(new Date().toDateString())
    }

    else if (cmd.startsWith(`curl`)) {
        if (!spl[1]) console.log(reg.HELP_CMD.CURL_SHOWN[1])
        else {
            let toFetch = spl[1];

            if (!toFetch.startsWith(`http://`) && !toFetch.startsWith(`https://`)) toFetch = `http://` + toFetch;
    
            try {
                await fetch(toFetch)
                .then(res => res.text())
                .then(body => console.log(body));
            } catch(e) {console.log("There was an error.")};
        }
    }

    else if (cmd.startsWith(`ping`)) {
        if (!spl[1]) console.log(reg.HELP_CMD.PING_SHOWN[1])
        else {
            let toFetch = spl[1];

            if (!toFetch.startsWith(`http://`) && !toFetch.startsWith(`https://`)) toFetch = `http://` + toFetch;
    
            try {
                let start = Date.now();
            
                await fetch(toFetch);
                
                let finish = Date.now();
        
                console.log(`Time: ${finish - start}ms`);
            } catch(e) {console.log("There was an error.")};
    
            
        }
    }

    else if(cmd.startsWith(`set`)) {
        let cont = true;
        if (fs.readdirSync(`./commands`).includes(spl[1] + ".js")) cont = false;

        if (cont == true) vars[spl[1]] = spl[2]
        else console.log(`Reserved: custom command`);
    }

    else if (cmd.startsWith(`mkdir`)) {
        try {fs.mkdirSync(spl[1])}
        catch(e) {console.log("There was en error.")};
    }

    else if (cmd.startsWith(`find`)) {
        try {fs.readFileSync(operatingDirectory + spl[1], `utf-8`).toString().includes(spl.slice(2).join(" ")) ? console.log(true) : console.log(false)}
        catch(e) {console.log("There was en error.")};
    }

    else if (cmd.startsWith(`copy`)) {
        try {fs.writeFileSync(operatingDirectory + spl[2], fs.readFileSync(operatingDirectory + spl[1], `utf-8`).toString())}
        catch(e) {console.log("There was en error.")};
    }

    else if (cmd.startsWith(`color`)) {
        switch(spl[1]) {
            case "reset":
                console.log("\x1b[0m");
                fontColor = "\x1b[0m";
                bgColor = "\x1b[0m";
            break;

            case "bright":
                console.log("\x1b[1m");
                fontColor = "\x1b[1m";
                bgColor = "\x1b[1m";
            break;

            case "dim":
                console.log("\x1b[2m");
                fontColor = "\x1b[2m";
                bgColor = "\x1b[2m";
            break;

            case "underscore":
                console.log("\x1b[4m");
                fontColor = "\x1b[4m";
                bgColor = "\x1b[4m";
            break;

            case "blink":
                console.log("\x1b[5m");
                fontColor = "\x1b[5m";
                bgColor = "\x1b[5m";
            break;

            case "reverse":
                console.log("\x1b[7m");
                fontColor = "\x1b[7m";
                bgColor = "\x1b[7m";
            break;

            case "hidden":
                console.log("\x1b[8m");
                fontColor = "\x1b[8m";
                bgColor = "\x1b[8m";
            break;

            case "fgblack":
                console.log("\x1b[30m");
                fontColor = "\x1b[30m";
            break;

            case "fgred":
                console.log("\x1b[31m");
                fontColor = "\x1b[31m";
            break;

            case "fggreen":
                console.log("\x1b[32m");
                fontColor = "\x1b[32m";
            break;

            case "fgyellow":
                console.log("\x1b[33m");
                fontColor = "\x1b[33m";
            break;

            case "fgblue":
                console.log("\x1b[34m");
                fontColor = "\x1b[34m";
            break;

            case "fgmagenta":
                console.log("\x1b[35m");
                fontColor = "\x1b[35m";
            break;

            case "fgcyan":
                console.log("\x1b[36m");
                fontColor = "\x1b[36m";
            break;

            case "fgwhite":
                console.log("\x1b[37m");
                fontColor = "\x1b[37m";
            break;

            case "bgblack":
                console.log("\x1b[40m");
                bgColor = "\x1b[40m";
            break;

            case "bgred":
                console.log("\x1b[41m");
                bgColor = "\x1b[41m";
            break;

            case "bggreen":
                console.log("\x1b[42m");
                bgColor = "\x1b[42m";
            break;

            case "bgyellow":
                console.log("\x1b[43m");
                bgColor = "\x1b[43m";
            break;

            case "bgblue":
                console.log("\x1b[44m");
                bgColor = "\x1b[44m";
            break;

            case "bgmagenta":
                console.log("\x1b[45m");
                bgColor = "\x1b[45m";
            break;

            case "bgcyan":
                console.log("\x1b[46m");
                bgColor = "\x1b[46m";
            break;

            case "bgwhite":
                console.log("\x1b[47m");
                bgColor = "\x1b[47m";
            break;

            case "help":
                console.log(["reset", "bright", "dim", "underscore", "blink", "reverse", "hidden", "fgblack", "fgred", "fggreen", "fgyellow",
                "fgblue", "fgmagenta", "fgcyan", "fgwhite", "bgblack", "bgred", "bggreen", "bgyellow", "bgblue", "bgmagenta", "bgcyan", "bgwhite"   
            ]);
            break;

            default:
                console.log("invalid");
        }
    }

    else if (cmd.startsWith(`cd`)) {
        if (!spl[1]) {console.log(reg.HELP_CMD.CD_SHOWN[1])}
        else {
            if (spl[1] == `default`) operatingDirectory = "./";
            else {
                if (!spl[1].endsWith(`/`)) spl[1] += "/";
                if (!fs.readdirSync(operatingDirectory).includes(spl[1].slice(0, -1))) console.log("This directory does not exist!");
                else {
                    let cont = true;
    
                    try {fs.readdirSync(operatingDirectory + spl[1].slice(0, -1))}
                    catch (e) {console.log("Not a directory!"); cont = false};
        
                    if (cont == true) {
                        operatingDirectory += spl[1];
                    }
                }
    
            }
        }
        
    }
    
    else if (cmd.startsWith('ftp')) {
        const client = new FTPClient();
        if (!await client.access({
            host: spl[1],
            user: prompt('Username: ').trim(),
            password: prompt('Password: ').trim(),
        }).catch(() => 0)) console.log('Authorization failed.');
        else {
            const task = await menu(
                [{ hotkey: 'D', title: 'Download files' }, { hotkey: 'U', title: 'Upload files' }],
                { header: 'FTP Task', border: true },
            );
            const ftpFiles = await client.list();
            if (task.hotkey === 'D') {
                const paths = [];
                let files = ftpFiles;
                let file;
                while (file = await menu(
                    files.map((f, i) => ({ hotkey: i + 1 + '', title: f.name })),
                    { header: 'FTP file to download', border: true },
                )) {
                    if (/^\.+$/.test(file.title)) paths.pop();
                    else {
                        if (files[file.hotkey - 1].type !== 2) break;
                        paths.push(file.title);
                    }
                    files = (paths.length ? [{ name: '..', type: 2 }] : []).concat(await client.list(join(...paths).replace(/\\/g, '/')));
                }
                const fromPath = join(...paths, file.title);
                console.log('From:', fromPath);
                const destPaths = [];
                let destFiles = ['.', ...fs
                    .readdirSync(operatingDirectory)
                    .filter(x => fs.statSync(join(operatingDirectory, x)).isDirectory())];
                let dest;
                while (destFiles.length && (dest = await menu(
                    destFiles.map((f, i) => ({ hotkey: i + 1 + '', title: f })),
                    { header: 'Local file destination', border: true },
                ))) {
                    if (dest.title === '.') break;
                    if (/^\.+$/.test(dest.title)) destPaths.pop();
                    else destPaths.push(dest.title);
                    destFiles = (destPaths.length ? ['..'] : []).concat('.', fs.readdirSync(join(operatingDirectory, ...destPaths)).filter(x => fs.statSync(join(operatingDirectory, ...destPaths, x).isDirectory())));
                }
                const toPath = join(operatingDirectory, ...destPaths, dest.title, file.title);
                console.log('To:', toPath);
                await client
                    .downloadTo(toPath, fromPath.replace(/\\/g, '/'))
                    .then(() => console.log('Successfully downloaded', fromPath, 'to', toPath))
                    .catch(e => console.log('Something went wrong:', e.message));
            } else {
                const paths = [];
                let files = fs.readdirSync(operatingDirectory);
                let file;
                while (file = await menu(
                    files.map((f, i) => ({ hotkey: i + 1 + '', title: f })),
                    { header: 'Local file to upload', border: true },
                )) {
                    if (/^\.+$/.test(file.title)) paths.pop();
                    else {
                                            if (!fs.statSync(join(operatingDirectory, ...paths, files[file.hotkey - 1])).isDirectory()) break;
                                            paths.push(file.title);
                                        } 
                    files = (paths.length ? ['..'] : []).concat(fs.readdirSync(join(operatingDirectory, ...paths)));
                }
                const fromPath = join(operatingDirectory, ...paths, file.title);
                console.log('From:', fromPath);
                const destPaths = [];
                let destFiles = [{ name: '.', type: 2 }, ...ftpFiles.filter(x => x.type === 2)];
                let dest;
                while (destFiles.length && (dest = await menu(
                    destFiles.map((f, i) => ({ hotkey: i + 1 + '', title: f.name })),
                    { header: 'FTP destination path', border: true },
                ))) {
                    if (dest.title === '.') break;
                    if (/^\.+$/.test(dest.title)) destPaths.pop();
                    else destPaths.push(dest.title);
                    destFiles = (destPaths.length ? [{ type: 2, name: '..' }] : []).concat({ type: 2, name: '.' }, (await client.list(join(...destPaths).replace(/\\/g, '/'))).filter(x => x.type === 2));
                }
                const toPath = join(...destPaths, prompt('Filename: '));
                console.log('To:', toPath);
                await client
                    .uploadFrom(fromPath, toPath.replace(/\\/g, '/'))
                    .then(() => console.log('Successfully uploaded', fromPath, 'to', toPath))
                    .catch(e => console.log('Something went wrong:', e.message));
            }
        }
    }


    // custom commands
    else {
        if (vars[spl[0]]) console.log("var: " + vars[spl[0]])
        else {
            try {fs.readdirSync(`./commands`)} catch(e) {console.log(`This command does not exist!`)};
            fs.readdirSync(`./commands`).includes(`${cmd}.js`) ? await eval(`(async () => {${fs.readFileSync(`./commands/${cmd}.js`, `utf-8`)}})();`) : console.log("This command does not exist!");
        }
    }

    // bus
    if (reg.BUS["DISABLE_CMD_LOGGING"] !== 1) {
        fs.appendFileSync(`./bus/recentcmds.txt`, `${cmd} ${Date.now()}\n`);

        if (users[u].administrator !== true) {}
        else if (reg.BUS["DISABLE_CMD_LOGGING_NOTIFICATION"] !== 1) {console.log(`BUS_CMD_LOGGING has logged ${cmd} to /bus/recentcmds.txt`)};
    }

    console.log();
    nd(u);
};
