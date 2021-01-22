// dependencies
const fs = require("fs");
const prompt = require("prompt-sync")();
const os = require("os");

// data
let version = "alpha-0.1";
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
        console.log(`Commands in NDOS ${version}`);
    };

    if (cmd.startsWith(`dir`)) {
        try {!spl[1] ? console.log(fs.readdirSync(`./`).join("\n")) : (console.log(fs.readdirSync(spl[1]).join(`\n`)));}
        catch (e) {console.log(`There was an error accessing this directory.`)};
    }

    if (cmd.startsWith(`exit`)) process.exit();

    if (cmd.startsWith(`clear`)) {clear()};

    if (cmd.startsWith(`write`)) {
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
    };

    if (cmd.startsWith(`read`)) {}

    console.log();
    nd();
};