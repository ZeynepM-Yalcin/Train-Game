/**@type {import("../typings/phaser")} */

import {LoadScene} from "./scenes/LoadScene";
import {Menu} from "./scenes/Menu";
import {LogIn} from "./scenes/LogIn";
//import {ChooseLevel} from "./scenes/ChooseLevel";


let game = new Phaser.Game({
    width: 1520,
    height: 795,
    scene:[
        LoadScene, Menu, LogIn//, ChooseLevel
    ]//,
    //for sprite:
    /*
    render:{
        pixelArt:true
    }*/



});