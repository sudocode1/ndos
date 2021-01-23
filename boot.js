// dependencies
const fs = require("fs");
const prompt = require("prompt-sync")();
const os = require("os");

// data
let version = "alpha-0.5";
let blueprint = true;

// functions


// boot
function clear() {
    console.clear();
    console.log(` Welcome to NDOS ${version}`);
    blueprint && console.log(`\x1b[31m`, `This version of NDOS is a blueprint! Use at your own risk`);
    console.log("\x1b[0m");
}

function boot() {
    clear();
    
    let bootscripts = false;

    try {fs.readdirSync(`./boot`); bootscripts = true;} catch(e) {console.log(` No boot folder found!`); bootscripts = false;};

    if (bootscripts === true) {
        console.log(`\x1b[33mRunning Boot Scripts`)
        console.log("\x1b[0m");

        fs.readdirSync(`./boot`).map(x => eval(fs.readFileSync(`./boot/${x}`, `utf-8`)));
    }

    nd();
}

boot();

// script
function nd() {
    let cmd = prompt(`ndos>`);

    let spl = cmd.split(" ");

    if (cmd.startsWith(`help`)) {
        let cmds = [
            ["help", "list commands"], 
            ["dir", "list folders in directory specified"], 
            ["exit", "exit nodedos"], 
            ["clear", "clear the console"], 
            ["write", "write text to a file"],
            ["read", "read a file"],
            ["execute", "execute a JavaScript file"],
            ["newdrive", "create new drive"],
            ["mount", "mount a drive"]
        ];
        console.log(`Commands in NDOS ${version}`);
        cmds.map(x => console.log(`${x[0]}: ${x[1]}`));
    }

    else if (cmd.startsWith(`dir`)) {
        try {!spl[1] ? console.log(fs.readdirSync(`./`).join("\n")) : (console.log(fs.readdirSync(spl[1]).join(`\n`)));}
        catch (e) {console.log(`There was an error accessing this directory.`)};
    }

    else if (cmd.startsWith(`exit`)) process.exit()

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
            fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, `file,hello.txt,hiehjhejahsdaFSHG|file,hi.js,console.log("hello")`);
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
                        fs.writeFileSync(`./drives/${drive}/${split[1]}`, split[2]);
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
                        str += `file,${x},` + fs.readFileSync(`./drives/${spl[1]}/${x}`, `utf-8`) + `|`;
                        fs.rmSync(`./drives/${spl[1]}/${x}`);
                    }};

                });

                fs.writeFileSync(`./drives/${spl[1]}/compress.txt`, str);
            }
            else null;


        }
    }

    else {
        try {fs.readdirSync(`./commands`)} catch(e) {console.log(`This command does not exist!`)};
        fs.readdirSync(`./commands`).includes(`${cmd}.js`) ? eval(fs.readFileSync(`./commands/${cmd}.js`, `utf-8`)) : console.log("This command does not exist!");
    }

    console.log();
    nd();
};